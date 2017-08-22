sap.ui.define([
  "com/dolphin/controller/BaseController",
  "sap/ui/model/json/JSONModel",
  "com/dolphin/util/Formatter",
  "sap/m/MessageToast",
  'sap/ui/model/Filter',
  'sap/ui/model/FilterOperator',
], function (BaseController, JSONModel, Formatter, MessageToast, Filter, FilterOperator) {
  "use strict";
  return BaseController.extend(
    "com.dolphin.controller.Detail", {
      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */
      /**
       * Called when the App view controller is instantiated.
       * @public
       */
      onInit: function () {
        sap.ui.core.BusyIndicator.hide();
        this.setModel(new JSONModel(
          {
            'Tracks':
            {
              'Stats':'002',
              'DocumentHeaderText': 'ER:' + new Date().getTime(),
              'CompanyCode': sap.ui.getCore().getModel('userModel').results[0].Bukrs,
              'Currency': sap.ui.getCore().getModel('userModel').results[0].Waers,
              'User': sap.ui.getCore().getModel('userModel').results[0].Xuser,
              'ReceiptDate': new Date(), 'DocDate': new Date()
              // 'Kostl': sap.ui.getCore().getModel('userModel').results[0].Kostl,
            },
            // 'SubLines': [{'LineNum':'1','Xref1':'This is a subline#1'}],
            'Items': [],
            'Approvers': [],
            'Contacts': [],
            'Notes': []
          }), 'viewModel');
        this._callExpenseTypeService();
        this.setModel(new JSONModel({ 'Kostl': sap.ui.getCore().getModel('userModel').results[0].Kostl, 'rowSelected': false }), 'configModel');
        // this.getRouter().getRoute("apDetail").attachPatternMatched(this._onPatternMatched, this);
        this.getRouter().getRoute("createER").attachPatternMatched(this._onPatternCreateERMatched, this);
        this.getRouter().getRoute("erDetail").attachPatternMatched(this._onPatternDetailERMatched, this);
      },
      /* =========================================================== */
      /* formatter methods                                           */
      /* =========================================================== */
      formatDate: function (date) {
      },
      formatURL: function (sUrl) {
        return "<iframe style=\"border:none; overflow: hidden; height: 100%; width: 95%; position: absolute;\" height=\"100%\" width=\"100%\" src=" +
          sUrl + "></iframe>";
      },
      _isDetailVisible: function (sSpkzl) {
        var oSpkzl, iCalcRate;
        if (this.getModel('configModel') && sSpkzl) {
          oSpkzl = this.getModel('configModel').getProperty('/ExpenseType')[sSpkzl];
          iCalcRate = parseInt(oSpkzl.CalcRate);
          return (iCalcRate > 0 || oSpkzl.Title.trim().length > 0);
        }
        // if (iCalcRate > 0 || oSpkzl.Title.trim().length > 0)
        //   return true;
        // return false;
      },
      _buttonType: function (sSpkzl) {
        var oSpkzl, iCalcRate;
        if (this.getModel('configModel') && sSpkzl) {
          oSpkzl = this.getModel('configModel').getProperty('/ExpenseType')[sSpkzl];
          iCalcRate = parseInt(oSpkzl.CalcRate);
          if (iCalcRate > 0 || oSpkzl.Title.trim().length > 0)
            return "Emphasized";
        }
      },
      _getErrorString: function (sEtype) {
        var sError;
        switch (sEtype) {
          case 'E':
            sError = 'Error';
            break;
          case 'W':
            sError = 'Warning';
            break;
          case 'S':
            sError = 'Success';
            break;
          case 'I':
            sError = 'Information';
            break;
          default:
            sError = 'Information';
            break;
        };
        return sError;
      },
      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */
      handleSave: function (oEvent) {
        this._saveExpenseReport(oEvent);
      },
      handleAddItem: function () {
        var oHeader = this.getModel('viewModel').getProperty('/Tracks');
        this.getModel('viewModel').getProperty('/Items').push({Kostl:'1000',Bukrs:'1000',CrgType:'CA',ExpCurrency:'USD'});
        this.getModel('viewModel').refresh();
      },
      handleCopyItem: function (oEvent) {
        var sPath = this.byId('idItemsTable').getSelectedItems()[0].getBindingContext('viewModel').sPath;
        var oSelectedRow = this.byId('idItemsTable').getSelectedItems()[0].getBindingContext('viewModel').getProperty(sPath);
        this.getModel('viewModel').getProperty('/Items').push(oSelectedRow);
        this.getModel('viewModel').refresh();
      },
      handleDeleteItem: function (oEvent) {
        var sPath = this.byId('idItemsTable').getSelectedItems()[0].getBindingContext('viewModel').sPath;
        var selectedIndex = sPath.slice(sPath.lastIndexOf('/') + 1);
        this.getModel('viewModel').getProperty('/Items').splice(selectedIndex, 1);
        this.getModel('viewModel').refresh();
      },
      handleSelectionChange: function (oEvent) {
        this.getModel('configModel').setProperty('/rowSelected', oEvent.getSource().getSelectedItems().length > 0);
      },
      handleCClines: function (oEvent) {
        var that = this;
        if (!that.pressDialog) {
          that.pressDialog = sap.ui.xmlfragment("com.dolphin.view.fragment.CreditCardLines", this);
          this.getView().addDependent(that.pressDialog);
        }
        this.pressDialog.open();
        this._callCCLinesService();
      },
      handleAcceptCCItems: function (oEvent) {
        var that = this;
        oEvent.getSource().getParent().getParent().getSelectedItems().forEach(function (obj) {
          var sPath = obj.getBindingContext('viewModel').sPath;
          // console.log(obj.getBindingContext('viewModel').getProperty(sPath));
          that.getModel('viewModel').getProperty('/Items').results.push(obj.getBindingContext('viewModel').getProperty(sPath));
          that.getModel('viewModel').refresh();
        });
        oEvent.getSource().getParent().getParent().getParent().close();
      },
      handleSubLineDetailClose : function(oEvent){
        oEvent.getSource().getParent().getParent().close();
      },
      handleExpTypeChange: function (oEvent) {
        if (oEvent.getSource().getSelectedKey()) {
          var sPath = oEvent.getSource().getBindingContext('viewModel').sPath,
              iPath = sPath.slice(sPath.lastIndexOf('/') + 1);
          if (oEvent.getSource().getSelectedKey() === 'ADVA') {
            this._callADVALinesService().then(function () {
              this.oViewModel.getProperty('/AdvLinesSet').results.forEach(function (item) {
                this.oViewModel.getProperty('/Items').push(item);
              }.bind(this));
              // var selectedIndex = oEvent.getSource().getBindingContext('viewModel').sPath.slice(sPath.lastIndexOf('/') + 1);
              this.oViewModel.getProperty('/Items').splice(this.iPath, 1);
              this.oViewModel.refresh();
            }.bind({ oViewModel: this.getModel('viewModel'), iPath: iPath }),
              function () {
                //Reject
              });
          } else {
            var sGlacc = this.getModel('configModel').getProperty('/ExpenseType')[oEvent.getSource().getSelectedKey()].GLAcc;
            this.getModel('viewModel').getProperty(sPath).Glacc=sGlacc;
            // debugger;
            // this.getModel('viewModel').setProperty(sPath,{Glacc:sGlacc});
            // this.oViewModel.getProperty('/Items').setProperty(sPath,{Glacc:})
          }
        }
      },
      /**
        * We will pop up the detail for selected expense type
        */
      handleDetailPress: function (oEvent) {
        var sExpType = oEvent.getSource().getBindingContext('viewModel').getProperty('Spkzl'),
          sQuantity = oEvent.getSource().getBindingContext('viewModel').getProperty('Menge'),
          oSpkzl = this.getModel('configModel').getProperty('/ExpenseType')[sExpType],
          iCalcRate = parseInt(oSpkzl.CalcRate),
          sPopOverXML;
        //If calc rate is present we show the mile popup
        if (iCalcRate <= 0) {
          // Create a popup element if not existing
          if (!this._oPopoverMiles) {
            this._oPopoverMiles = sap.ui.xmlfragment("com.dolphin.view.fragment.SubLineDetails", this);
            this.getView().addDependent(this._oPopoverMiles);
          }
          var sPath = oEvent.getSource().getBindingContext('viewModel').getPath();
          //Get the miles table
          var oTable = sap.ui.getCore().byId('idMilesTable');
          oTable.setBindingContext(oEvent.getSource().getBindingContext('viewModel'), 'viewModel');
          if (!this.getModel('viewModel').getProperty(sPath).hasOwnProperty('SubLines'))
            this.getModel('viewModel')
              .setProperty(oEvent.getSource()
                .getBindingContext('viewModel').getPath() + '/SubLines', []);
          this.getModel('viewModel').refresh();
          this._oPopoverMiles.openBy(oEvent.getSource());
        }
        // Else we show the details table
        else {
          if (!this._oPopoverSubLines) {
            this._oPopoverSubLines = sap.ui.xmlfragment("com.dolphin.view.fragment.SubLineMiles", this);
            this.getView().addDependent(this._oPopoverSubLines);
            sap.ui.getCore().byId('idCalcRateText').setText(iCalcRate);
            sap.ui.getCore().byId('idCountText').setText(sQuantity);
          }
          this._oPopoverSubLines.openBy(oEvent.getSource());
        }
      },
      handleAddSubLines: function (oEvent) {
        var sBindingPath = sap.ui.getCore().byId('idMilesTable').getBindingContext('viewModel').getPath();
        sap.ui.getCore().byId('idMilesTable').getBindingContext('viewModel').getProperty(sBindingPath).SubLines.push({});
        this.getModel('viewModel').refresh();
      },
      handleMessagePress : function(oEvent){
        if (!this._oMsgPopover) {
          this._oMsgPopover = sap.ui.xmlfragment("com.dolphin.view.fragment.MessagePopover", this);
          this.getView().addDependent(this._oMsgPopover);
        }
        this._oMsgPopover.openBy(oEvent.getSource());
      },
      /* =========================================================== */
      /* Internal Methods                                            */
      /* =========================================================== */
      _onPatternCreateERMatched: function (oEvent) {
        this.getModel('configModel').setProperty('/WebConfig', sap.ui.getCore().getModel('configModel'));
        this.getModel('viewModel').setProperty('/UIModel', { 'CreateMode': true });
      },
      _onPatternDetailERMatched : function(oEvent){
        this.getModel('configModel').setProperty('/WebConfig', sap.ui.getCore().getModel('configModel'));
        this.getModel('viewModel').setProperty('/UIModel', { 'CreateMode': false });
        var sRecNo = oEvent.getParameter("arguments").RecNo;
        this._callTracksService(sRecNo);
        this._callInvoiceItemsService(sRecNo);
      },
      _setMessageModel: function (oData) {
        var oMsgModel = new JSONModel(oData.error.innererror.errordetails);
        this.setModel(oMsgModel, 'messages');
      },
      // Calls the Tracks Service
      _callTracksService: function (sRecNo) {
        this.getOwnerComponent().getModel('apModel')
          .read("/Tracks('" + sRecNo + "')", {
            success: function (oData, oResponse) {
              this.getModel('viewModel').setProperty('/Tracks', oData);
            }.bind(this),
            error: function (oData, oResponse) {
              console.log(oResponse);
            }
          });
      },
      // Calls the Invoice Items Service
      _callInvoiceItemsService: function (sRecNo) {
        this.getOwnerComponent().getModel('apModel')
          .read("/Tracks('" + sRecNo + "')/InvoiceItems", {
            success: function (oData, oResponse) {
              this.getModel('viewModel').setProperty('/Items', oData);
            }.bind(this),
            error: function (oData, oResponse) {
              console.log(oResponse);
            }
          });
      },
      _callCCLinesService: function () {
        this.getOwnerComponent().getModel('erModel')
          .read("/CCLinesSet", {
            success: function (oData, oResponse) {
              this.getModel('viewModel').setProperty('/CCLines', oData);
            }.bind(this),
            error: function (oData, oResponse) {
              console.log(oResponse);
            }
          });
      },
      _callADVALinesService: function () {
        return new Promise(function (resolve, reject) {
          this.getOwnerComponent().getModel('erModel')
            .read("/AdvLinesSet", {
              success: function (oData, oResponse) {
                this.getModel('viewModel').setProperty('/AdvLinesSet', oData);
                resolve();
              }.bind(this),
              error: function (oData, oResponse) {
                console.log(oResponse);
                reject(oError);
              }
            });
        }.bind(this));
      },
      _callExpenseTypeService: function () {
        this.getOwnerComponent().getModel('erModel')
          .read("/ExpenseTypeSet", {
            filters: [
              new Filter(
                'CompanyCode', FilterOperator.EQ,
                this.getModel('viewModel').getProperty('/Tracks').CompanyCode)
            ],
            success: function (oData, oResponse) {
              this.getModel('viewModel').setProperty('/ExpenseTypeSet', oData);
              var oExpTypes = oData.results.reduce((oFinal, oLine) => {
                oFinal[oLine.ExpType] = oFinal[oLine.ExpType] || {};
                oFinal[oLine.ExpType].CompanyCode = oLine.CompanyCode;
                oFinal[oLine.ExpType].NameOfExpType = oLine.NameOfExpType;
                oFinal[oLine.ExpType].CalcRate = oLine.CalcRate;
                oFinal[oLine.ExpType].Vat = oLine.Vat;
                oFinal[oLine.ExpType].GLAcc = oLine.GLAcc;
                oFinal[oLine.ExpType].CountryKey = oLine.CountryKey;
                oFinal[oLine.ExpType].Title = oLine.Title;
                return oFinal;
              }, {});
              this.getModel('configModel').setProperty('/ExpenseType', oExpTypes);
            }.bind(this),
            error: function (oData, oResponse) {
              console.log(oResponse);
            }
          });
        sap.ui.core.BusyIndicator.hide();
      },
      //Save Expense Report
      _saveExpenseReport: function () {
        var oTracks = this.getModel('viewModel').getProperty('/Tracks'),
          oErModel = this.getModel('erModel'),
          that = this;

          
        oTracks.SubLines = [];
        oTracks.ItemER = this.getModel('viewModel').getProperty('/Items');
        this.getModel('viewModel').getProperty('/Items').forEach(function(item,index){
          item.SubLines.forEach(function(subLine){
            subLine.LineNum = index+1+'';
            oTracks.SubLines.push(subLine);
          }.bind({index:index,oTracks:oTracks}));
          delete item.SubLines;
        }.bind(oTracks));


        // oTracks.er_item = this.getModel('viewModel').getProperty('/Items');
        // oTracks.ApproversER = this.getModel('viewModel').getProperty('/Approvers');
        // oTracks.ContactsER = this.getModel('viewModel').getProperty('/Contacts');
        // oTracks.ERNotes = this.getModel('viewModel').getProperty('/Notes');
        // oTracks.SubLines = this.getModel('viewModel').getProperty('/SubLines');
        // oTracks.InvoiceItems = this.getModel('viewModel').getProperty('/Items').results;
        // oTracks.Sublines = this.getModel('viewModel').getProperty('/Sublines');
        sap.ui.core.BusyIndicator.show();
        // oErModel.setUseBatch(true);
        oErModel.setHeaders({ 'PTSUser': 'ADAMS', 'PTSLocale': 'E', 'PTSIgnoreWarning': 'X' });

        oErModel.create('/HeaderERSet', oTracks, {
          success: function (oData, response) {
            MessageToast.show(oData.Recno + ' created as a draft');
            sap.ui.core.BusyIndicator.hide();
            // that._executeApprovalAction("", "A", sRecNo);
          },
          error: function (oError) {
            sap.ui.core.BusyIndicator.hide();
            that.displayErrorPopup(oError);
            // that._setMessageModel(oError);
          }.bind(this)
        });
      }
    });
});