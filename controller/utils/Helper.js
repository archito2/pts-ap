sap.ui.define([
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
], function (Filter, FilterOperator) {
    "use strict";
    return {
        toUpperCase: function (sName) {
            return sName && sName.toUpperCase();
        },
        /**
         * Will try to create a new record
         * @return Promise
         */
        createAP: function (sStatus, apModel, viewModel) {
            var oTracks = viewModel.getProperty('/CRHeader');
            oTracks.Stats = sStatus;
            // Approver set property names are different in save and create
            if (viewModel.getProperty('/Approvers')) {
                var aModified = viewModel.getProperty('/Approvers').map(function (approver) {
                    var modifiedApprover = {};
                    modifiedApprover.ApproversUserid = approver.ApproverID;
                    modifiedApprover.SeqNoOfApprover = approver.Seq;
                    return modifiedApprover;
                });
            }
            oTracks.CRApprovers = aModified;
            oTracks.CRAttachments = viewModel.getProperty('/Attachments/GUIDs');
            oTracks.CRContacts = [];
            oTracks.CRItems = viewModel.getProperty('/InvoiceItems');
            oTracks.CRNotes = [{}];
            apModel.setHeaders({
                'PTSUser': sap.ui.getCore().getModel('userModel').results[0].Xuser,
                'PTSLocale': 'E',
                'PTSIgnoreWarning': ''
            });
            return new Promise(function (resolve, reject) {
                apModel.create('/CRHeaderSet', oTracks, {
                    success: function (oData) {
                        resolve(oData);
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },
        /**
         * Get user details
         * @return Promise of user detail service
         */
        getUserDetails: function (apModel, sUserId) {
            return new Promise(function (resolve, reject) {
                apModel.read("/UserListSet", {
                    filters: [new Filter('USER', FilterOperator.EQ, sUserId)],
                    success: function (oData) {
                        resolve(oData.results);
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },
        saveNotes: function (apModel, sUserId, sNotes, sRecNo) {
            console.log('saveNotes started');
            return new Promise(function (resolve, reject) {
                apModel.callFunction("/append_note", {
                    method: "POST",
                    urlParameters: {
                        "NOTE_USER": '',
                        "IMPV_NEWNOTES": sNotes,
                        "RECNO": sRecNo
                    },
                    success: function (oData) {
                        console.log('saveNotes success');
                        resolve(oData);
                    },
                    error: function (oError) {
                        console.log('saveNotes error');
                        reject(oError);
                    }
                });
            });
        },
        getNotes: function (apModel, sRecNo) {
            return new Promise(function (resolve, reject) {
                apModel.read("/Tracks('" + sRecNo + "')/Notes", {
                    success: function (oData) {
                        resolve(oData);
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },
        callSetSubStatusCode: function (apModel, sStats, sSubstats, sRecNo) {
            console.log('callSetSubStatusCode started');
            return new Promise(function (resolve, reject) {
                apModel
                    .callFunction("/set_substatus_code", {
                        urlParameters: {
                            Stats: sStats,
                            RecNo: sRecNo,
                            Substats: sSubstats
                        },
                        method: "POST",
                        success: function (oData) {
                            console.log('callSetSubStatusCode success');
                            resolve();
                        },
                        error: function (oError) {
                            console.error('callSetSubStatusCode error');
                            reject(oError);
                        }
                    });
            });
        },
        callWorkflowService: function (apModel, sRecNo, sDecision) {
            console.log('callWorkflowService started');
            return new Promise(function (resolve, reject) {
                apModel
                    .callFunction("/record_action", {
                        urlParameters: {
                            USER: '',
                            RECNO: sRecNo,
                            DECISION: sDecision
                        },
                        method: "POST",
                        success: function (oData) {
                            console.log('callWorkflowService success');
                            resolve(oData);
                        },
                        error: function (oError) {
                            console.error('callWorkflowService error');
                            reject(oError);
                        }
                    });
            });
        },
        _callExpenseTypeService: function (erModel, sCompCode) {
            return new Promise(function (resolve, reject) {
                erModel.read("/ExpenseTypeSet", {
                    filters: [
                        new Filter(
                            'CompanyCode', FilterOperator.EQ,
                            sCompCode)
                    ],
                    success: function (oData, oResponse) {
                        resolve(oData);
                        // this.getModel().setProperty('/ExpenseTypeSet', oData);
                        // var oExpTypes = oData.results.reduce(function (oFinal, oLine) {
                        //     oFinal[oLine.ExpType] = oFinal[oLine.ExpType] || {};
                        //     oFinal[oLine.ExpType].CompanyCode = oLine.CompanyCode;
                        //     oFinal[oLine.ExpType].NameOfExpType = oLine.NameOfExpType;
                        //     oFinal[oLine.ExpType].CalcRate = oLine.CalcRate;
                        //     oFinal[oLine.ExpType].Vat = oLine.Vat;
                        //     oFinal[oLine.ExpType].GLAcc = oLine.GLAcc;
                        //     oFinal[oLine.ExpType].CountryKey = oLine.CountryKey;
                        //     oFinal[oLine.ExpType].Title = oLine.Title;
                        //     return oFinal;
                        // }, {});
                        // this.getModel('configModel').setProperty('/ExpenseType', oExpTypes);
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },
        getExpenseTypes: function (aExpenseTypes) {
            return aExpenseTypes.reduce(function (oFinal, oLine) {
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
        },
        saveExpenseReport: function (oTracks, oErModel) {
            return new Promise(function (resolve, reject) {
                oErModel.create('/HeaderERSet', oTracks, {
                    success: function (oData, response) {
                        resolve(oData);
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },
    };
});