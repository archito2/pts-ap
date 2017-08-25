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
                // this.setModel(new JSONModel(
                //   {
                //     'Tracks':
                //     {
                //       'Stats': '002',
                //       'DocumentHeaderText': 'ER:' + new Date().getTime(),
                //       'CompanyCode': sap.ui.getCore().getModel('userModel').results[0].Bukrs,
                //       'Currency': sap.ui.getCore().getModel('userModel').results[0].Waers,
                //       'User': sap.ui.getCore().getModel('userModel').results[0].Xuser,
                //       'ReceiptDate': new Date(), 'DocDate': new Date()
                //       // 'Kostl': sap.ui.getCore().getModel('userModel').results[0].Kostl,
                //     },
                //     // 'SubLines': [{'LineNum':'1','Xref1':'This is a subline#1'}],
                //     'Items': [],
                //     'Approvers': [],
                //     'Contacts': [],
                //     'Notes': []
                //   }), );
                // this._callExpenseTypeService();
                // this.setModel(new JSONModel({ 'Kostl': sap.ui.getCore().getModel('userModel').results[0].Kostl, 'rowSelected': false }), 'configModel');
                // this.getRouter().getRoute("apDetail").attachPatternMatched(this._onPatternMatched, this);
                // this.getRouter().getRoute("createER").attachPatternMatched(this._onPatternCreateERMatched, this);
                // this.getRouter().getRoute("erDetail").attachPatternMatched(this._onPatternDetailERMatched, this);
                // this.getRouter().getRoute("apDetail").attachPatternMatched(this._onPatternDetailAPMatched, this);
                this.getRouter().attachRouteMatched(this._onAttachRouteMatched, this);
            },
            /**
             * This method will be called every time when the Detail.view.xml is invoked.
             */
            _onAttachRouteMatched: function (oEvent) {
                var urlPattern = oEvent.getParameter('name'),
                    sRecNo = oEvent.getParameter('arguments').RecNo;
                this.setModel(new JSONModel());
                if (urlPattern === 'apDetail') {
                    this.getModel().setProperty('/WebConfig', sap.ui.getCore().getModel('configModel'));
                    this.getModel().setProperty('/UIModel', {
                        'CreateMode': false
                    });
                    this._callTracksService(sRecNo).then(
                        function () {
                            this._callInvoiceItemsService(sRecNo);
                            this._callApproverService(sRecNo);
                            this._callHistoryItemsService(sRecNo);
                            this._callNotesService(sRecNo);
                        }.bind(this));


                }
            },
            /* =========================================================== */
            /* formatter methods                                           */
            /* =========================================================== */
            formatDate: function (date) { },
            formatTime: function (time) {
                var parts = time.match(/.{1,2}/g);
                return parts[0] + ":" + parts[1] + ":" + parts[2];
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
                var oHeader = this.getModel().getProperty('/Tracks');
                this.getModel().getProperty('/Items').push({
                    Kostl: '1000',
                    Bukrs: '1000',
                    CrgType: 'CA',
                    ExpCurrency: 'USD'
                });
                this.getModel().refresh();
            },
            handleCopyItem: function (oEvent) {
                var sPath = this.byId('idItemsTable').getSelectedItems()[0].getBindingContext().sPath;
                var oSelectedRow = this.byId('idItemsTable').getSelectedItems()[0].getBindingContext().getProperty(sPath);
                this.getModel().getProperty('/Items').push(oSelectedRow);
                this.getModel().refresh();
            },
            handleDeleteItem: function (oEvent) {
                var sPath = this.byId('idItemsTable').getSelectedItems()[0].getBindingContext().sPath;
                var selectedIndex = sPath.slice(sPath.lastIndexOf('/') + 1);
                this.getModel().getProperty('/Items').splice(selectedIndex, 1);
                this.getModel().refresh();
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
                    var sPath = obj.getBindingContext().sPath;
                    // console.log(obj.getBindingContext().getProperty(sPath));
                    that.getModel().getProperty('/Items').results.push(obj.getBindingContext().getProperty(sPath));
                    that.getModel().refresh();
                });
                oEvent.getSource().getParent().getParent().getParent().close();
            },
            handleSubLineDetailClose: function (oEvent) {
                oEvent.getSource().getParent().getParent().close();
            },
            handleExpTypeChange: function (oEvent) {
                if (oEvent.getSource().getSelectedKey()) {
                    var sPath = oEvent.getSource().getBindingContext().sPath,
                        iPath = sPath.slice(sPath.lastIndexOf('/') + 1);
                    if (oEvent.getSource().getSelectedKey() === 'ADVA') {
                        this._callADVALinesService().then(function () {
                            this.oViewModel.getProperty('/AdvLinesSet').results.forEach(function (item) {
                                this.oViewModel.getProperty('/Items').push(item);
                            }.bind(this));
                            // var selectedIndex = oEvent.getSource().getBindingContext().sPath.slice(sPath.lastIndexOf('/') + 1);
                            this.oViewModel.getProperty('/Items').splice(this.iPath, 1);
                            this.oViewModel.refresh();
                        }.bind({
                            oViewModel: this.getModel(),
                            iPath: iPath
                        }),
                            function () {
                                //Reject
                            });
                    } else {
                        var sGlacc = this.getModel('configModel').getProperty('/ExpenseType')[oEvent.getSource().getSelectedKey()].GLAcc;
                        this.getModel().getProperty(sPath).Glacc = sGlacc;
                        // debugger;
                        // this.getModel().setProperty(sPath,{Glacc:sGlacc});
                        // this.oViewModel.getProperty('/Items').setProperty(sPath,{Glacc:})
                    }
                }
            },
            /**
             * We will pop up the detail for selected expense type
             */
            handleDetailPress: function (oEvent) {
                var sExpType = oEvent.getSource().getBindingContext().getProperty('Spkzl'),
                    sQuantity = oEvent.getSource().getBindingContext().getProperty('Menge'),
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
                    var sPath = oEvent.getSource().getBindingContext().getPath();
                    //Get the miles table
                    var oTable = sap.ui.getCore().byId('idMilesTable');
                    oTable.setBindingContext(oEvent.getSource().getBindingContext(), );
                    if (!this.getModel().getProperty(sPath).hasOwnProperty('SubLines'))
                        this.getModel()
                            .setProperty(oEvent.getSource()
                                .getBindingContext().getPath() + '/SubLines', []);
                    this.getModel().refresh();
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
                var sBindingPath = sap.ui.getCore().byId('idMilesTable').getBindingContext().getPath();
                sap.ui.getCore().byId('idMilesTable').getBindingContext().getProperty(sBindingPath).SubLines.push({});
                this.getModel().refresh();
            },
            handleMessagePress: function (oEvent) {
                if (!this._oMsgPopover) {
                    this._oMsgPopover = sap.ui.xmlfragment("com.dolphin.view.fragment.MessagePopover", this);
                    this.getView().addDependent(this._oMsgPopover);
                }
                this._oMsgPopover.openBy(oEvent.getSource());
            },
            handlePoLinkClicked: function (oEvent) {
                var oCtx = oEvent.getSource().getBindingContext(),
                    sPath = oCtx.getPath(),
                    sPoNumber = oCtx.getProperty(sPath).Ebeln,
                    sPOItem = oCtx.getProperty(sPath).Ebelp;
                var aPOItems = this.getModel().getProperty('/POItems'),
                    aLocalPOItems = aPOItems.filter(function (item) {
                        return item.Ebeln === sPoNumber;
                    });
                this.getModel().setProperty('/LocalPOItems', aLocalPOItems);
                if (!this._oPopover) {
                    this._oPopover = sap.ui.xmlfragment("com.dolphin.view.fragment.POItems", this);
                    this.getView().addDependent(this._oPopover);
                }
                this._oPopover.openBy(oEvent.getSource());
            },
            /* =========================================================== */
            /* Internal Methods                                            */
            /* =========================================================== */
            _onPatternCreateERMatched: function (oEvent) {
                this.getModel('configModel').setProperty('/WebConfig', sap.ui.getCore().getModel('configModel'));
                this.getModel().setProperty('/UIModel', {
                    'CreateMode': true
                });
            },
            _onPatternDetailERMatched: function (oEvent) {
                this.getModel('configModel').setProperty('/WebConfig', sap.ui.getCore().getModel('configModel'));
                this.getModel().setProperty('/UIModel', {
                    'CreateMode': false
                });
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
                return new Promise(function (resolve, reject) {
                    this.getOwnerComponent().getModel('apModel')
                        .read("/Tracks('" + sRecNo + "')", {
                            success: function (oData, oResponse) {
                                this.getModel().setProperty('/Tracks', oData);
                                if (oData.PurchasingDocument) {
                                    this.getModel().setProperty('/UIModel/isPORecord', true);
                                    this._callPOItemsService(sRecNo);
                                    resolve();
                                } else
                                    this.getModel().setProperty('/UIModel/isPORecord', false);
                            }.bind(this),
                            error: function (oData, oResponse) {
                                console.log(oResponse);
                                reject(oResponse);
                            }
                        });
                }.bind(this));
            },
            // Calls the Invoice Items Service
            _callInvoiceItemsService: function (sRecNo) {
                this.getOwnerComponent().getModel('apModel')
                    .read("/Tracks('" + sRecNo + "')/InvoiceItems", {
                        success: function (oData, oResponse) {
                            this.getModel().setProperty('/InvoiceItems', oData.results);
                            this._splitInvoiceItems();
                        }.bind(this),
                        error: function (oData, oResponse) {
                            console.log(oResponse);
                        }
                    });
            },
            _callPOItemsService: function (sRecNo) {
                this.getOwnerComponent().getModel('apModel')
                    .read("/Tracks('" + sRecNo + "')/POItems", {
                        success: function (oData, oResponse) {
                            this.getModel().setProperty('/POItems', oData.results);
                        }.bind(this),
                        error: function (oData, oResponse) {
                            console.log(oResponse);
                        }
                    });
            },
            // Calls the Approvers Service
            _callApproverService: function (sRecNo) {
                this.getOwnerComponent().getModel('apModel')
                    .read("/Tracks('" + sRecNo + "')/Approvers", {
                        success: function (oData, oResponse) {
                            this.getModel().setProperty('/Approvers', oData.results);
                        }.bind(this),
                        error: function (oData, oResponse) {
                            console.log(oResponse);
                        }
                    });
            },
            // Calls the History Service
            _callHistoryItemsService: function (sRecNo) {
                this.getOwnerComponent().getModel('apModel')
                    .read("/Tracks('" + sRecNo + "')/HistoryItems", {
                        success: function (oData, oResponse) {
                            this.getModel().setProperty('/HistoryItems', oData.results);
                        }.bind(this),
                        error: function (oData, oResponse) {
                            console.log(oResponse);
                        }
                    });
            },
            // Calls the History Service
            _callNotesService: function (sRecNo) {
                this.getOwnerComponent().getModel('apModel')
                    .read("/Tracks('" + sRecNo + "')/Notes", {
                        success: function (oData, oResponse) {
                            this.getModel().setProperty('/Notes', oData.results);
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
                            this.getModel().setProperty('/CCLines', oData);
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
                                this.getModel().setProperty('/AdvLinesSet', oData);
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
                                this.getModel().getProperty('/Tracks').CompanyCode)
                        ],
                        success: function (oData, oResponse) {
                            this.getModel().setProperty('/ExpenseTypeSet', oData);
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
                var oTracks = this.getModel().getProperty('/Tracks'),
                    oErModel = this.getModel('erModel'),
                    that = this;


                oTracks.SubLines = [];
                oTracks.ItemER = this.getModel().getProperty('/Items');
                this.getModel().getProperty('/Items').forEach(function (item, index) {
                    item.SubLines.forEach(function (subLine) {
                        subLine.LineNum = index + 1 + '';
                        oTracks.SubLines.push(subLine);
                    }.bind({
                        index: index,
                        oTracks: oTracks
                    }));
                    delete item.SubLines;
                }.bind(oTracks));


                // oTracks.er_item = this.getModel().getProperty('/Items');
                // oTracks.ApproversER = this.getModel().getProperty('/Approvers');
                // oTracks.ContactsER = this.getModel().getProperty('/Contacts');
                // oTracks.ERNotes = this.getModel().getProperty('/Notes');
                // oTracks.SubLines = this.getModel().getProperty('/SubLines');
                // oTracks.InvoiceItems = this.getModel().getProperty('/Items').results;
                // oTracks.Sublines = this.getModel().getProperty('/Sublines');
                sap.ui.core.BusyIndicator.show();
                // oErModel.setUseBatch(true);
                oErModel.setHeaders({
                    'PTSUser': 'ADAMS',
                    'PTSLocale': 'E',
                    'PTSIgnoreWarning': 'X'
                });

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
            },
            _splitInvoiceItems: function () {
                // debugger;
                if (this.getModel().getProperty('/Tracks').PurchasingDocument)
                    this.getModel().setProperty('/UIModel/isPORecord', true);
                else
                    this.getModel().setProperty('/UIModel/isPORecord', false);
                this.getModel().refresh();
                var aInvoiceItems = this.getModel().getProperty('/InvoiceItems'),
                    aPOBasedLines = [];
                aInvoiceItems.forEach(function (item, index) {
                    if (item.Ebeln && item.Ebelp) {
                        if (!item.Glacc) {
                            aPOBasedLines.push(item);
                        }
                    }
                });
                this.getModel().setProperty('/POBasedLines', aPOBasedLines);
                // this.getModel().setProperty('/MAALines', aMaaLines);
                // this.getModel().setProperty('/InvoiceItems', aGlLines);
                this.getModel().refresh();
            }
        });
});