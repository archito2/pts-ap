sap.ui.define([
    "com/dolphin/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "com/dolphin/util/Formatter",
    "sap/m/MessageToast",
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
], function(BaseController, JSONModel, Formatter, MessageToast, Filter, FilterOperator) {
    "use strict";
    return BaseController.extend(
        "com.dolphin.controller.Hitlist", {
            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */
            /**
             * Called when the App view controller is instantiated.
             * @public
             */
            onInit: function() {
                this.getRouter().attachRouteMatched(this._onPatternMatched, this);
            },
            /* =========================================================== */
            /* formatter methods                                           */
            /* =========================================================== */
            formatDate: function(date) {
                if (null === date)
                    return "";
                return Formatter.MediumDateFormat.format(
                    new Date(date.getTime() + new Date(date.getTime()).getTimezoneOffset() * 60 * 1000)
                );
            },
            /* =========================================================== */
            /* event handlers                                              */
            /* =========================================================== */
            /**
             * Event handler for the 'Home' icon on the page header
             * @param  oEvent
             */
            handlePressHome: function(oEvent) {
                this.getRouter()
                    .navTo("home");
            },
            handleLogoffPress: function(oEvent) {
                sap.m.URLHelper.redirect("/logout.html", false);
            },
            handleSearchTracks: function(oEvent) {},
            handleDetailRowSelect: function(oEvent) {
                this.getRouter().navTo('apDetail', {
                    RecNo: oEvent.getSource().getBindingContext().getProperty().RecNo
                });
            },
            /* =========================================================== */
            /* Internal Methods                                            */
            /* =========================================================== */
            _onPatternMatched: function(oEvent) {
                var aFilter = [];
                this.setModel(new JSONModel({
                    'filterBar': {}
                }), 'configModel');
                this.setModel(new JSONModel({
                    'Tracks': {}
                }));
                sap.ui.core.BusyIndicator.hide();
                this.getModel('configModel').setProperty('/filterBar/open', true);
                var sSearchType = oEvent.getParameter("arguments").navParam;
                this.getModel('configModel').setProperty('/filterBar/selectedAction', sSearchType);
                this.getModel('configModel').refresh();
                if (sSearchType === 'approvals')
                    aFilter.push(new Filter('MyApprovalsStr', FilterOperator.EQ, 'X'));
                else if (sSearchType === 'submissions')
                    aFilter.push(new Filter('MyApprovalsStr', FilterOperator.EQ, 'C'));
                else if (sSearchType === 'drafts')
                    aFilter.push(new Filter('Status', FilterOperator.EQ, '002'));
                else
                    aFilter.push([]);
                this._searchTracks(aFilter);
            },
            _getFilter: function(oEvent, customEvent) {
                var aSelectionSet, aFilter = [];
                if (oEvent)
                    aSelectionSet = oEvent.getParameter('selectionSet');
                else
                    aSelectionSet = customEvent.selectionSet;
                aSelectionSet.forEach(function(filterElement) {
                    if (filterElement.data('filterId') === 'MySelection') {
                        if (filterElement.getProperty('selectedKey') === 'approvals')
                            aFilter.push(new Filter('MyApprovalsStr', FilterOperator.EQ, 'X'));
                        else if (filterElement.getProperty('selectedKey') === 'submissions')
                            aFilter.push(new Filter('MyApprovalsStr', FilterOperator.EQ, 'C'));
                        else
                            aFilter.push(new Filter('Status', FilterOperator.EQ, '002'));
                    } else {
                        if (filterElement.getProperty('value'))
                            aFilter.push(new Filter(filterElement.data('filterId'), FilterOperator.EQ, filterElement.getProperty('value')));
                    }
                });
                return aFilter;
            },
            _searchTracks: function(aFilter) {
                var apModel = this.getOwnerComponent().getModel('apModel');
                apModel.read('/Tracks', {
                    filters: aFilter,
                    success: function(oData) {
                        this.getModel().setProperty('/Tracks', oData.results);
                    }.bind(this),
                    failure: function(oError) {
                        //TODO : 
                    }
                });
            }
        });
});