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
                'PTSUser': 'ADAMS',
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
        saveNotes: function (apModel, sUserId, oEvent, sRecNo) {
            return new Promise(function (resolve, reject) {
                apModel.callFunction("/append_note", {
                    method: "POST",
                    urlParameters: {
                        "NOTE_USER": '',
                        "IMPV_NEWNOTES": oEvent.getSource().getValue(),
                        "RECNO": sRecNo
                    },
                    success: function (oData) {
                        resolve(oData);
                    },
                    error: function (oError) {
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
        }
    };
});