sap.ui.define([
  "com/dolphin/controller/BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast"
], function (BaseController, JSONModel, MessageToast) {
  "use strict";
  return BaseController.extend(
    "com.dolphin.controller.Home", {
      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */
      /**
       * Called when the App view controller is instantiated.
       * @public
       */
      onInit: function () {
      },
      /* =========================================================== */
      /* formatter methods                                           */
      /* =========================================================== */
      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */
      handleTilePress : function(oEvent){
          var oItem, oCtx, sId;
			oItem = oEvent.getSource();
			oCtx = oItem.getBindingContext('data');
			sId = oCtx.getProperty("id");
			this.getRouter().navTo(sId);
      }
      /* =========================================================== */
      /* Internal Methods                                            */
      /* =========================================================== */
    });
});