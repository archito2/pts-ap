sap.ui.define([
  "com/dolphin/controller/BaseController",
  "sap/ui/model/json/JSONModel",
  "com/dolphin/util/Formatter"
], function (BaseController, JSONModel, Formatter) {
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
        var oApModel = this.getOwnerComponent().getModel('apModel');
        this.getView().setModel(oApModel);
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
      }
    });
});