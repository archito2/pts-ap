sap.ui.define([
    "com/dolphin/controller/BaseController",
    "com/dolphin/controller/utils/Helper",
    "com/dolphin/controller/utils/Formatter",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/m/Dialog',
    'sap/ui/core/routing/History'
], function (BaseController, Helper, Formatter, JSONModel, MessageToast, Filter, FilterOperator, Dialog, History) {
    "use strict";
    var sInvoicePath;

    return BaseController.extend(
        "com.dolphin.controller.Detail", {
            formatter: Formatter,
            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */
            /**
             * Called when the App view controller is instantiated.
             * @public
             */
            onInit: function () {
                // if(this.byId('idPaneContainer'))
                //     this.byId('idPaneContainer').removePane(1);
                this.getRouter().attachRouteMatched(this._onAttachRouteMatched, this);
            },
            /**
             * This method will be called every time when the Detail.view.xml is invoked.
             */
            _onAttachRouteMatched: function (oEvent) {
                var urlPattern = oEvent.getParameter('name');
                this.setModel(new JSONModel());
                this.getModel().setProperty('/WebConfig', sap.ui.getCore().getModel('configModel'));
                this.getModel().setProperty('/UIModel', {
                    'createMode': false,
                    'invoiceItems': {
                        'createMode': false
                    },
                    'header': {
                        'createMode': false
                    },
                    'footer': {
                        'create': {
                            'visible': true,
                        },
                        'save': {
                            'visible': true,
                        },
                        'submit': {
                            'visible': true,
                        },
                        'accept': {
                            'visible': true,
                        },
                        'reject': {
                            'visible': true,
                        },
                        'reject2last': {
                            'visible': true,
                        },
                        'forward': {
                            'visible': true,
                        }
                    },
                    'busy': false
                });
                var currTime = new Date();
                if (urlPattern === 'apDetail' || urlPattern === 'erDetail') {
                    sap.ui.core.BusyIndicator.hide();
                    var sRecNo = oEvent.getParameter('arguments').RecNo;
                    this._callTracksService(sRecNo);
                    this._callInvoiceItemsService(sRecNo);
                    this._callApproverService(sRecNo);
                    this._callHistoryItemsService(sRecNo);
                    this._callNotesService(sRecNo);
                    this._callAttachmentService(sRecNo);
                } else if (urlPattern === 'apCreate') {
                    //This is create AP 
                    sap.ui.core.BusyIndicator.hide();
                    this.getModel().setProperty('/UIModel', {
                        'createMode': true,
                        'invoiceItems': {
                            'createMode': true
                        }
                    });
                    this.getModel().setProperty('/CRHeader', {
                        'Bukrs': sap.ui.getCore().getModel('userModel').results[0].Bukrs,
                        'Waers': sap.ui.getCore().getModel('userModel').results[0].Waers,
                        // this is only for testing 
                        'Xblnr': 'CR-' + currTime.getHours() + ':' + currTime.getMinutes() + ':' + currTime.getSeconds(),
                        'Xbldt': new Date(),
                        'Lifnr': '1000',
                        'Wrbtr': '100'
                    });
                } else {
                    //This is create ER
                    this.getModel().setProperty('/UIModel', {
                        'createMode': true,
                        'invoiceItems': {
                            'createMode': true
                        }
                    });
                    this.getModel().setProperty('/Tracks', {
                        'CompanyCode': sap.ui.getCore().getModel('userModel').results[0].Bukrs,
                        'Currency': sap.ui.getCore().getModel('userModel').results[0].Waers,
                        // this is only for testing 
                        'DocumentHeaderText': 'ER-' + currTime.getHours() + ':' + currTime.getMinutes() + ':' + currTime.getSeconds(),
                        'DocDate': new Date(),
                        'ReceiptDate': new Date(),
                        'User': 'ADAMS'
                    });
                    Helper._callExpenseTypeService(
                            this.getModel('erModel'),
                            sap.ui.getCore().getModel('userModel').results[0].Bukrs)
                        .then(function (oData) {
                            oData.results.unshift({
                                "ExpType": "--Select--",
                                "NameOfExpType": "--Select--"
                            });
                            this.getModel().setProperty('/ExpenseTypeSet', oData.results);
                            this.getModel().setProperty('/ExpenseType', Helper.getExpenseTypes(oData.results));

                            // this.getModel().setProperty('/SubLineDetail',
                            //     this.getModel().getProperty('/ExpenseType')[this.getModel().getProperty('/ExpenseTypeSet')[0].ExpType]);
                            sap.ui.core.BusyIndicator.hide();
                        }.bind(this))
                        .catch(function (oError) {
                            sap.ui.core.BusyIndicator.hide();
                        });
                }
                this.getModel().setProperty('/Attachments', {
                    'uploadURL': '/pts-ap/proxy_abap/sap/bc/dol/file_upload?temp=X'
                });
            },
            /* =========================================================== */
            /* event handlers                                              */
            /* =========================================================== */
            /* ===============Attachments Fragment======================== */
            onUploadComplete: function (oEvent) {
                if (oEvent.getParameter('mParameters').responseRaw) {
                    this.getModel().setProperty('/Attachments/GUIDs', [{
                        'GUID': JSON.parse(oEvent.getParameter('mParameters').responseRaw).temp_guid
                    }]);
                }
            },
            onFileUploadChange: function (oEvent) {},
            onBeforeUploadStarts: function (oEvent) {
                var oCustomerHeader = new sap.m.UploadCollectionParameter({
                    name: "PTSUser",
                    value: sap.ui.getCore().getModel('userModel').results[0].Xuser
                });
                oEvent.getParameters().addHeaderParameter(oCustomerHeader);
            },
            /* ===============Attachments Fragment======================== */
            /*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
            /* =================Approvers Fragment======================== */
            //When selecting the approver menu action
            handleApprovalMenuAction: function (oEvent) {},
            handleAddManger: function (oEvent) {
                //Get the manager user id from the user model
                var sMgrUserId = sap.ui.getCore().getModel('userModel').results[0].MgrUserId;
                //Call the user detail service witht he manager id to get the mgr deatils
                sap.ui.core.BusyIndicator.show();
                Helper.getUserDetails(this.getModel('apModel'), sMgrUserId).then(function (oData) {
                        //Success
                        //Check if the result returned atleast one row of result
                        if (oData.length > 0) {
                            //Create a mgr object
                            var oMgr = {
                                'ApproverID': sMgrUserId,
                                'ApproverName': oData[0].Fname + " " + oData[0].Lname
                            };
                            //If the model exists already add the object
                            if (this.getModel().getProperty('/Approvers')) {
                                this.getModel().getProperty('/Approvers').push(oMgr);
                                oMgr.Seq = this.getModel().getProperty('/Approvers').length;
                            }
                            //Else set a new array to the object
                            else {
                                this.getModel().setProperty('/Approvers', [oMgr]);
                                oMgr.Seq = 1;
                            }
                            this.getModel().refresh();
                        } else {
                            MessageToast.show('No details for the Manager id:' + sMgrUserId);
                        }
                        sap.ui.core.BusyIndicator.hide();
                    }.bind(this),
                    function (oError) {
                        //Error
                        this._showErrorDialog(oError);
                        sap.ui.core.BusyIndicator.hide();
                    }.bind(this));
            },
            /* =================Approvers Fragment======================== */
            /*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
            /* ==============Invoice Items Fragment======================= */
            handleAddInvoiceItem: function (oEvent) {
                var userModel = sap.ui.getCore().getModel('userModel');
                var oInvoiceItem = {
                    Bukrs: this.getModel().getProperty('/CRHeader/Bukrs'),
                    Shkzg: 'S'
                };
                if (this.getModel().getProperty('/InvoiceItems'))
                    this.getModel().getProperty('/InvoiceItems').push(oInvoiceItem);
                else
                    this.getModel().setProperty('/InvoiceItems', [oInvoiceItem]);
                this.getModel().refresh();
            },
            handleERAddItem: function (oEvent) {
                var userModel = sap.ui.getCore().getModel('userModel');
                var oInvoiceItem = {
                    Bukrs: this.getModel().getProperty('/Header/Bukrs'),
                    Shkzg: 'S'
                };
                if (this.getModel().getProperty('/InvoiceItems'))
                    this.getModel().getProperty('/InvoiceItems').push(oInvoiceItem);
                else
                    this.getModel().setProperty('/InvoiceItems', [oInvoiceItem]);
                this.getModel().refresh();
            },
            handleEditInvoiceItem: function (oEvent) {
                var bCreateMode = this.getModel().getProperty('/UIModel/invoiceItems/createMode');
                this.getModel().setProperty('/UIModel/invoiceItems/createMode', !bCreateMode);
                this.getModel().refresh();
            },
            handleInvoiceCopyItem: function (oEvent) {
                var sPath = this.byId('idInvoiceItemsTable').getSelectedItems()[0].getBindingContext().sPath;
                var oSelectedRow = this.byId('idInvoiceItemsTable').getSelectedItems()[0].getBindingContext().getProperty(sPath);
                // this is deep copy of the object-oSelectedRow
                this.getModel().getProperty('/InvoiceItems').push(jQuery.extend(true, {}, oSelectedRow));
                this.getModel().refresh();
            },
            handleInvoiceDeleteItem: function (oEvent) {
                var sPath = oEvent.getSource().getParent().getParent().getSelectedItems()[0].getBindingContext().sPath;
                // var sPath = this.byId('idInvoiceItemsTable').getSelectedItems()[0].getBindingContext().sPath;
                var selectedIndex = sPath.slice(sPath.lastIndexOf('/') + 1);
                this.getModel().getProperty('/InvoiceItems').splice(selectedIndex, 1);
                this.getModel().refresh();
            },
            handleInvoiceApplyBalances: function (oEvent) {
                // Get the header total
                var sHeaderTotal = this.getModel().getProperty('/CRHeader/Wrbtr'),
                    fHeaderTotal = parseFloat(sHeaderTotal),
                    fItemAmount = 0;
                // Calculate the totals from the invoice items
                this.getModel().getProperty('/InvoiceItems').forEach(function (invoiceItem) {
                    if (invoiceItem.Netwr) {
                        fItemAmount += parseFloat(invoiceItem.Netwr);
                    }
                });
                //Get the slected row and apply the balance
                var sPath = this.byId('idInvoiceItemsTable').getSelectedItems()[0].getBindingContext().sPath;
                var oSelectedRow = this.byId('idInvoiceItemsTable').getSelectedItems()[0].getBindingContext().getProperty(sPath);
                oSelectedRow.Netwr = "" + Math.round(((fHeaderTotal - fItemAmount) * 100) / 100);
                this.getModel().refresh();
            },
            handleInvoiceDistributeBalances: function (oEvent) {
                // Get the header total
                var sHeaderTotal = this.getModel().getProperty('/CRHeader/Wrbtr'),
                    fHeaderTotal = parseFloat(sHeaderTotal),
                    iNumberOfLines = this.getModel().getProperty('/InvoiceItems').length,
                    fDistributionAmount = fHeaderTotal / iNumberOfLines;
                fDistributionAmount = Math.round(fDistributionAmount * 100) / 100;
                var finalDiff = fHeaderTotal - fDistributionAmount * this.getModel().getProperty('/InvoiceItems').length;
                this.getModel().getProperty('/InvoiceItems').forEach(function (invoiceItem, index) {
                    if (index === 0)
                        invoiceItem.Netwr = "" + Math.round((fDistributionAmount + finalDiff) * 100) / 100;
                    else
                        invoiceItem.Netwr = "" + fDistributionAmount;
                });


                this.getModel().refresh();
            },
            /* ==============Invoice Items Fragment======================= */
            /*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
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
                    if (that.getModel().getProperty('/InvoiceItems'))
                        that.getModel().getProperty('/InvoiceItems').push(obj.getBindingContext().getProperty(sPath));
                    that.getModel().refresh();
                });
                oEvent.getSource().getParent().getParent().getParent().close();
            },
            handleSubLineDetailClose: function (oEvent) {
                oEvent.getSource().getParent().getParent().close();
            },
            handleSubDetailClose: function (oEvent) {
                var oInvoiceItem = this.getModel().getProperty(this.sInvoicePath),
                    oSubLineDetail = this.getModel().getProperty('/SubLineDetail');
                oInvoiceItem.ExpAmount = oSubLineDetail.CalcRate * oSubLineDetail.Count;
                if (oSubLineDetail.From && oSubLineDetail.To )
                    oInvoiceItem.Sgtxt = oSubLineDetail.From + " " + oSubLineDetail.To;
                oEvent.getSource().getParent().getParent().close();
                this.getModel().setProperty('/SubLineDetail', {});
                this.getModel().refresh();
            },
            handleExpTypeChange: function (oEvent) {
                if (oEvent.getSource().getSelectedKey()) {
                    var sPath = oEvent.getSource().getBindingContext().sPath,
                        iPath = sPath.slice(sPath.lastIndexOf('/') + 1);
                    this.getModel().setProperty('/SubLineDetail',
                        this.getModel().getProperty('/ExpenseType')[oEvent.getSource().getSelectedKey()]);
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
                        var sGlacc = this.getModel().getProperty('/ExpenseType')[oEvent.getSource().getSelectedKey()].GLAcc;
                        this.getModel().getProperty(sPath).Glacc = sGlacc;
                        // this.getModel().setProperty(sPath,{Glacc:sGlacc});
                        // this.oViewModel.getProperty('/Items').setProperty(sPath,{Glacc:})
                    }
                }
                this.getModel().refresh();
            },
            handleExpDetailPress: function (oEvent) {
                var sExpType = oEvent.getSource().getBindingContext().getProperty('Spkzl'),
                    sQuantity = oEvent.getSource().getBindingContext().getProperty('Menge'),
                    sAmount = oEvent.getSource().getBindingContext().getProperty('ExpAmount'),
                    iAmount = parseInt(sAmount),
                    oSpkzl = this.getModel().getProperty('/ExpenseType')[sExpType],
                    iCalcRate = parseInt(oSpkzl.CalcRate),
                    sPopOverXML;
                this.sInvoicePath = oEvent.getSource().getBindingContext().getPath();
                // var oInvoiceItem = this.getModel().getProperty(oEvent.getSource().getBindingContext().getPath());

                // this.byId('idItemsTable').setSelectedItem()
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
                    // oTable.setBindingContext(oEvent.getSource().getBindingContext(), );
                    if (!this.getModel().getProperty(sPath).hasOwnProperty('SubLines'))
                        this.getModel()
                        .setProperty(oEvent.getSource()
                            .getBindingContext().getPath() + '/SubLines', []);
                    this.getModel().refresh();
                    this._oPopoverMiles.openBy(oEvent.getSource());
                }
                // Else we show the details table
                else {
                    this.getModel().setProperty('/SubLineDetail/CalcRate', iCalcRate);
                    this.getModel().setProperty('/SubLineDetail/Count', iAmount ? (iAmount / iCalcRate) + "" : "");
                    if (!this._oPopoverSubLines) {
                        this._oPopoverSubLines = sap.ui.xmlfragment("com.dolphin.view.fragment.SubLineMiles", this);
                        this.getView().addDependent(this._oPopoverSubLines);
                        // sap.ui.getCore().byId('idCalcRateText').setText(iCalcRate);
                        // sap.ui.getCore().byId('idCountText').setText(sQuantity);
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
                    sPOItem = oCtx.getProperty(sPath).Ebelp,
                    aPOItems = this.getModel().getProperty('/POItems'),
                    aLocalPOItems = aPOItems.filter(function (item) {
                        return item.PoNumber === sPoNumber;
                    });
                this.getModel().setProperty('/LocalPOItems', aLocalPOItems);
                this.getModel().refresh();
                if (!this._oPopover) {
                    this._oPopover = sap.ui.xmlfragment("com.dolphin.view.fragment.POItems", this);
                    this.getView().addDependent(this._oPopover);
                }
                this._oPopover.openBy(oEvent.getSource());
            },
            handleSaveButtonClick: function (oEvent) {
                this._saveAP();
            },
            handleERSaveButtonClick: function (oEvent) {
                this._saveExpenseReport();
            },
            handleAcceptButtonClick: function (oEvent) {
                this._saveAP().then(function () {
                    this.pressDialog.open();
                    this._callSubStatusSetService(this.getModel().getProperty('/Tracks').RecNo);
                }.bind(this), function (oError) {
                    this._showErrorDialog(oError);
                });
                if (!this.pressDialog) {
                    this.pressDialog = sap.ui.xmlfragment("com.dolphin.view.fragment.SubStatusSelect", this);
                    this.getView().addDependent(this.pressDialog);
                }
            },
            handleAcceptReasonCodeButtonClick: function (oEvent) {
                var oCtx = sap.ui.getCore().byId('idSubStatusTable').getSelectedItem().getBindingContext(),
                    sPath = oCtx.getPath(),
                    sSubstats = oCtx.getProperty(sPath).Substats,
                    sRecNo = this.getModel().getProperty('/Tracks').RecNo;
                sap.ui.core.BusyIndicator.show();
                Helper.callSetSubStatusCode(this.getModel('apModel'), '061', sSubstats, sRecNo)
                    .then(function () {
                        return Helper.callWorkflowService(this.getModel('apModel'), sRecNo, 'A');
                    }.bind(this))
                    .then(function () {
                        return Helper.saveNotes(
                            this.getModel('apModel'),
                            sap.ui.getCore().getModel('userModel').results[0].Xuser,
                            sap.ui.getCore().byId('submitDialogTextarea').getValue(),
                            this.getModel().getProperty('/Tracks/RecNo'));
                    }.bind(this))
                    .then(function () {
                        sap.ui.core.BusyIndicator.hide();
                        this.that.pressDialog.close();
                        MessageToast.show('Record accepted successfully');
                        var oHistory = History.getInstance();
                        var sPreviousHash = oHistory.getPreviousHash();
                        if (sPreviousHash !== undefined) {
                            // history contains a previous entry
                            window.history.go(-1);
                        } else {
                            this.navTo("home");
                        }
                    }.bind({
                        that: this
                    }))
                    .catch(function (oError) {
                        sap.ui.core.BusyIndicator.hide();
                        this._showErrorDialog(oError);
                    }.bind(this));
            },
            handleCanceltReasonCodeButtonClick: function (oEvent) {
                oEvent.getSource().getParent().close();
            },
            handleCreateButtonClick: function (oEvent) {
                sap.ui.core.BusyIndicator.show();
                Helper.createAP('002', this.getModel('apModel'), this.getModel()).then(function (oData) {
                        //Success
                        sap.ui.core.BusyIndicator.hide();
                        var sRecNo = oData.Recno;
                        MessageToast.show('Record # ' + sRecNo + ' created successfullly');
                        this.getRouter().navTo("apDetail", {
                            RecNo: sRecNo
                        });
                    }.bind(this),
                    function (oError) {
                        //Error
                        sap.ui.core.BusyIndicator.hide();
                        this._showErrorDialog(oError);
                    }.bind(this));
            },
            handleSubmitButtonClick: function (oEvent) {
                sap.ui.core.BusyIndicator.show();
                Helper.createAP('010', this.getModel('apModel'), this.getModel()).then(function (oData) {
                        //Success
                        sap.ui.core.BusyIndicator.hide();
                        var sRecNo = oData.Recno;
                        MessageToast.show('Record # ' + sRecNo + ' submitted successfullly');
                        this.getRouter().navTo("apDetail", {
                            RecNo: sRecNo
                        });
                    }.bind(this),
                    function (oError) {
                        //Error
                        sap.ui.core.BusyIndicator.hide();
                        this._showErrorDialog(oError);
                    }.bind(this));
            },
            removeLeadingZeros: function (oEvent) {

            },
            onNotesPost: function (oEvent) {
                this.getModel().setProperty('/UIModel/busy', true);
                Helper.saveNotes(
                    this.getModel('apModel'),
                    sap.ui.getCore().getModel('userModel').results[0].Xuser,
                    oEvent.getSource().getValue(),
                    this.getModel().getProperty('/Tracks/RecNo')).then(function (oData) {
                    //Success
                    // this._callNotesService(this.getModel().getProperty('/Tracks/RecNo'));
                    this.getModel().setProperty('/UIModel/busy', false);
                    Helper.getNotes(
                        this.getModel('apModel'),
                        this.getModel().getProperty('/Tracks/RecNo')).then(function (oData) {
                        //Success
                        this.getModel().setProperty('/Notes', oData.results);
                        this.getModel().setProperty('/UIModel/busy', false);
                        this.getModel().refresh();
                    }.bind(this));
                }.bind(this)).catch(function (oError) {
                    //Error
                    this.getModel().setProperty('/UIModel/busy', false);
                });
            },
            handleLiveChange: function (oEvent) {
                var sText = oEvent.getParameter('value');
                var parent = oEvent.getSource().getParent();
                parent.getBeginButton().setEnabled(sText.length > 0);
            },
            /* =========================================================== */
            /* Internal Methods                                            */
            /* =========================================================== */
            _setMessageModel: function (oData) {
                var oMsgModel = new JSONModel(oData.error.innererror.errordetails);
                this.setModel(oMsgModel, 'messages');
            },
            // Calls the Tracks Service
            _callTracksService: function (sRecNo) {
                this.getOwnerComponent().getModel('apModel')
                    .read("/Tracks('" + sRecNo + "')", {
                        success: function (oData, oResponse) {
                            this.getModel().setProperty('/Tracks', oData);
                            if (oData.PurchasingDocument) {
                                this.getModel().setProperty('/UIModel/isPORecord', true);
                                this._callPOItemsService(sRecNo);
                            } else
                                this.getModel().setProperty('/UIModel/isPORecord', false);
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
            // Calls the Notes Service
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
            _callAttachmentService: function (sRecNo) {
                this.getOwnerComponent().getModel('apModel')
                    .read("/Tracks('" + sRecNo + "')/Attachments", {
                        success: function (oData, oResponse) {
                            this.getModel().setProperty('/Attachments', oData.results);
                        }.bind(this),
                        error: function (oData, oResponse) {
                            console.log(oResponse);
                        }
                    });
            },
            _callSubStatusSetService: function (sRecNo) {
                this.getModel('apModel')
                    .read("/SubStatusSet", {
                        filters: [
                            new Filter('RecNo', FilterOperator.EQ, sRecNo),
                            new Filter('Stats', FilterOperator.EQ, '061')
                        ],
                        success: function (oData) {
                            this.getModel().setProperty('/SubStatusSet', oData.results);
                        }.bind(this),
                        error: function (oError) {
                            this._showErrorDialog(oError);
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
            _saveExpenseReport: function () {
                var oTracks = this.getModel().getProperty('/Tracks'),
                    oErModel = this.getModel('erModel');
                oTracks.SubLines = [];
                oTracks.ItemER = this.getModel().getProperty('/InvoiceItems');
                if (this.getModel().getProperty('/InvoiceItems'))
                    this.getModel().getProperty('/InvoiceItems').forEach(function (item, index) {
                        if (item.SubLines)
                            item.SubLines.forEach(function (subLine) {
                                subLine.LineNum = index + 1 + '';
                                oTracks.SubLines.push(subLine);
                            }.bind({
                                index: index,
                                oTracks: oTracks
                            }));
                        delete item.SubLines;
                    }.bind(oTracks));
                oTracks.Stats = '002';
                oTracks.ApproversER = this.getModel().getProperty('/Approvers');
                oTracks.ERNotes = this.getModel().getProperty('/Notes');
                oTracks.ItemER = this.getModel().getProperty('/InvoiceItems');
                oTracks.Sublines = this.getModel().getProperty('/Sublines');
                sap.ui.core.BusyIndicator.show();
                oErModel.setHeaders({
                    'PTSUser': sap.ui.getCore().getModel('userModel').results[0].Xuser,
                    'PTSLocale': 'E',
                    'PTSIgnoreWarning': 'X'
                });
                Helper.saveExpenseReport(oTracks, oErModel).then(function (oData) {
                        sap.ui.core.BusyIndicator.hide();
                        MessageToast.show(oData.Recno + ' saved');
                    })
                    .catch(function (oError) {
                        sap.ui.core.BusyIndicator.hide();
                        this._showErrorDialog(oError);
                    }.bind(this));
            },
            _saveAP: function () {
                var apModel = this.getModel('apModel'),
                    oTracks = this.getModel().getProperty('/Tracks');

                oTracks.InvoiceItems = this.getModel().getProperty('/InvoiceItems');
                apModel.setHeaders({
                    'PTSUser': sap.ui.getCore().getModel('userModel').results[0].Xuser,
                    'PTSLocale': 'E',
                });
                sap.ui.core.BusyIndicator.show();
                return new Promise(function (resolve, reject) {
                    apModel.create('/Tracks', oTracks, {
                        success: function (oData) {
                            MessageToast.show(oData.RecNo + ' saved');
                            sap.ui.core.BusyIndicator.hide();
                            resolve();
                        },
                        error: function (oError) {
                            this._showErrorDialog(oError);
                            reject(oError);
                        }.bind(this)
                    });
                }.bind(this));
            },
            _splitInvoiceItems: function () {
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
            },
            _proccessErrorMesssages: function (oError) {

            },
            _showErrorDialog: function (oError) {
                var oErrorResponse = JSON.parse(oError.responseText);
                sap.ui.core.BusyIndicator.hide();
                var dialog = new Dialog({
                    title: oError.message,
                    type: 'Message',
                    state: 'Error',
                    content: new sap.m.Text({
                        text: oErrorResponse.error.message.value
                    }),
                    beginButton: new sap.m.Button({
                        text: 'OK',
                        press: function () {
                            dialog
                                .close();
                        }
                    }),
                    afterClose: function () {
                        dialog.destroy();
                    }
                });
                dialog.open();
            },
        });
});