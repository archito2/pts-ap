sap.ui.define([
    "com/dolphin/controller/BaseController",
    "com/dolphin/controller/utils/Helper",
    "com/dolphin/controller/utils/Formatter",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/m/Dialog'
], function (BaseController, Helper, Formatter, JSONModel, MessageToast, Filter, FilterOperator, Dialog) {
    "use strict";

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
                sap.ui.core.BusyIndicator.hide();
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
                    }
                });
                if (urlPattern === 'apDetail') {
                    var sRecNo = oEvent.getParameter('arguments').RecNo;
                    this._callTracksService(sRecNo);
                    this._callInvoiceItemsService(sRecNo);
                    this._callApproverService(sRecNo);
                    this._callHistoryItemsService(sRecNo);
                    this._callNotesService(sRecNo);
                    this._callAttachmentService(sRecNo);
                } else {
                    //This is create AP
                    this.getModel().setProperty('/UIModel', {
                        'CreateMode': true,
                        'InvoiceItems': {
                            'CreateMode': true
                        }
                    });
                    this.getModel().setProperty('/CRHeader', {
                        'Bukrs': sap.ui.getCore().getModel('userModel').results[0].Bukrs,
                        'Waers': sap.ui.getCore().getModel('userModel').results[0].Waers
                    });
                    this.getModel().setProperty('/Attachments', {
                        'uploadURL': '/pts-ap/proxy_abap/sap/bc/dol/file_upload?temp=X'
                    });
                }
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
                    value: "ADAMS"
                });
                oEvent.getParameters().addHeaderParameter(oCustomerHeader);
            },
            /* ===============Attachments Fragment======================== */
            /*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
            /* =================Approvers Fragment======================== */
            //When selecting the approver menu action
            handleApprovalMenuAction: function (oEvent) {
                debugger;
            },
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
                                oMgr.Seq = this.getModel().getProperty('/Approvers').length-1;
                            }
                            //Else set a new array to the object
                            else {
                                this.getModel().setProperty('/Approvers', [oMgr]);
                                oMgr.Seq = 0;
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
            handleAddInvoiceItem: function (oEvent) {
                var userModel = sap.ui.getCore().getModel('userModel');
                var oInvoiceItem = {
                    Kostl: userModel.results[0].Kostl,
                    Bukrs: this.getModel().getProperty('/CRHeader/Bukrs'),
                };
                if (this.getModel().getProperty('/InvoiceItems'))
                    this.getModel().getProperty('/InvoiceItems').push(oInvoiceItem);
                else
                    this.getModel().setProperty('/InvoiceItems', [oInvoiceItem]);
                this.getModel().refresh();
            },
            handleEditInvoiceItem: function (oEvent) {
                var bCreateMode = this.getModel().getProperty('/UIModel/InvoiceItems/CreateMode');
                this.getModel().setProperty('/UIModel/InvoiceItems/CreateMode', !bCreateMode);
                this.getModel().refresh();
            },
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
                this._callSetSubStatusCode('061', sSubstats, sRecNo)
                    .then(this._callWorkflowService(sRecNo, 'A')).catch(function () {});
            },
            handleCreateButtonClick: function (oEvent) {
                sap.ui.core.BusyIndicator.show();
                Helper.createAP(this.getModel('apModel'), this.getModel()).then(function (oData) {
                        //Success
                        sap.ui.core.BusyIndicator.hide();
                        var sRecNo = oData.Recno;
                        MessageToast.show('Record # ' + sRecNo + ' created successfullly');
                        // this.getRouter().navTo("apDetail", {
                        //     RecNo: sRecNo
                        // });
                    }.bind(this),
                    function (oError) {
                        //Error
                        sap.ui.core.BusyIndicator.hide();
                        this._showErrorDialog(oError);
                    }.bind(this));
            },
            removeLeadingZeros: function (oEvent) {

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
            _callSetSubStatusCode: function (sStats, sSubstats, sRecNo) {
                return new Promise(function (resolve, reject) {
                    this.getModel('apModel')
                        .callFunction("/set_substatus_code", {
                            urlParameters: {
                                Stats: sStats,
                                RecNo: sRecNo,
                                Substats: sSubstats
                            },
                            method: "POST",
                            success: function (oData) {
                                resolve();
                            }.bind(this),
                            error: function (oError) {
                                reject(oError);
                            }
                        });
                }.bind(this));
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
                            var oExpTypes = oData.results.reduce(function (oFinal, oLine) {
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
            _callWorkflowService: function (sRecNo, sDecision) {
                this.getModel('apModel')
                    .callFunction("/record_action", {
                        urlParameters: {
                            USER: '',
                            RECNO: sRecNo,
                            DECISION: 'A'
                        },
                        method: "POST",
                        success: function (oData) {}.bind(this),
                        error: function (oError) {
                            this._showErrorDialog(oError);
                        }.bind(this)
                    });
            },
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
            _saveAP: function () {
                var apModel = this.getModel('apModel'),
                    oTracks = this.getModel().getProperty('/Tracks');

                oTracks.InvoiceItems = this.getModel().getProperty('/InvoiceItems');
                apModel.setHeaders({
                    'PTSUser': 'ADAMS',
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