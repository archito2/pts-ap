sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/Device"
], function (UIComponent, Device) {
  "use strict";

  return UIComponent.extend("com.dolphin.Component", {

    metadata: {
      manifest: "json"
    },

    /**
     * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
     * @public
     * @override
     */
    init: function () {
      // call the base component's init function
      sap.ui.core.BusyIndicator.show(1000);
      UIComponent.prototype.init.apply(this, arguments);
      sap.ui.getCore().setModel(this.getModel("i18n"), "i18n");
      var oApModel = this.getModel('apModel');
      oApModel.setHeaders({ 'PTSMaxHits': '50' });

      oApModel.attachMetadataLoaded(function () {
        // var oMetaData = oApModel.getServiceMetadata();
        sap.ui.core.BusyIndicator.hide();
        sap.m.MessageToast.show('Successfull connection to SAP established, click away');
      });
      // var tracksRead = new Promise(function (resolve, reject) {
      //   oApModel.read('/Tracks', {
      //     success: function (oData, oResponse) {
      //       resolve(oData);
      //     },
      //     error: function (oError) {
      //       reject(oError)
      //     }
      //   });
      // });
      // tracksRead.then(function(oData){
      //   debugger;
      // },function(oError){
      //   debugger;
      // });
      // oApModel.read('/Tracks', {
      //   success: function (oData, oResponse) {
      //     debugger;
      //   },
      //   error: function (oError) {

      //   }
      // })

      // set the device model
      // this.setModel(models.createDeviceModel(), "device");

      // create the views based on the url/hash
      this.getRouter().initialize();
    },
    /**
     * The component is destroyed by UI5 automatically.
     * In this method, the ErrorHandler is destroyed.
     * @public
     * @override
     */
    destroy: function () {
      this._oErrorHandler.destroy();
      // call the base component's destroy function
      UIComponent.prototype.destroy.apply(this, arguments);
    },

    /**
     * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
     * design mode class should be set, which influences the size appearance of some controls.
     * @public
     * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
     */
    getContentDensityClass: function () {
      if (this._sContentDensityClass === undefined) {
        // check whether FLP has already set the content density class; do nothing in this case
        if (jQuery(document.body).hasClass("sapUiSizeCozy") ||
          jQuery(document.body).hasClass("sapUiSizeCompact")
        ) {
          this._sContentDensityClass = "";
        } else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
          this._sContentDensityClass = "sapUiSizeCompact";
        } else {
          // "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
          this._sContentDensityClass = "sapUiSizeCozy";
        }
      }
      return this._sContentDensityClass;
    }
  });
});