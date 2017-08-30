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
        createAP: function (apModel, viewModel) {
            var oTracks = viewModel.getProperty('/CRHeader');
            oTracks.Stats = '002';
            oTracks.CRApprovers = [];
            oTracks.CRAttachments = viewModel.getProperty('/Attachments/GUIDs');
            oTracks.CRContacts = [];
            oTracks.CRItems = viewModel.getProperty('/InvoiceItems');
            oTracks.CRNotes = [{}];
            apModel.setHeaders({
                'PTSUser': 'ADAMS',
                'PTSLocale': 'E',
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
        }
    };
});