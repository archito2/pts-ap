sap.ui.define([
  "com/dolphin/controller/BaseController",
  "sap/ui/model/json/JSONModel",
  "com/dolphin/util/Formatter",
  "sap/m/MessageToast"
], function (BaseController, JSONModel, Formatter, MessageToast) {
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
      onInit: function () {
        this._searchTracks();
      },
      /* =========================================================== */
      /* formatter methods                                           */
      /* =========================================================== */
      formatDate: function (date) {
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
      handlePressHome: function (oEvent) {
        this.getRouter()
          .navTo("home");
      },
      handleLogoffPress: function (oEvent) {
        sap.m.URLHelper.redirect("/logout.html", false);
      },
      handleSearchTracks: function (oEvent) {
      },
      handleDetailRowSelect: function (oEvent) {
        this.getRouter().navTo('apDetail', { RecNo: oEvent.getSource().getBindingContext('tracksModel').getProperty().RecNo });
      },
      _searchTracks: function (aFilters) {
        this
          .getOwnerComponent()
          .getModel('apModel')
          .read('/Tracks', {
            success: function (oData) {
              this.setModel(new JSONModel(oData), 'tracksModel');
              this.getModel('tracksModel').setProperty('/number', oData.results.length);
            }.bind(this),
            error: function (oError) {

            }.bind(this)
          });
      }
    });
});