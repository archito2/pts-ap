sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/Device",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
], function (UIComponent, Device, Filter, FilterOperator) {
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
      sap.ui.core.BusyIndicator.show();
      UIComponent.prototype.init.apply(this, arguments);
      var oApModel = this.getModel('apModel');
      oApModel.setHeaders({
        'PTSMaxHits': '50'
      });

      oApModel.metadataLoaded()
        .then(function () {
          return this._callUserDetailsService(this.getModel('apModel'));
        }.bind(this))
        .then(function () {
          return this._callStatusSetServive(this.getModel('apModel'));
        }.bind(this))
        .then(function () {
          console.log('All data loaded, proceeding with router');
          //Set the the headers for the AP Model
          oApModel.setHeaders({
            'PTSUser': sap.ui.getCore().getModel('userModel').results[0].Xuser,
            'PTSMaxHits': '50'
          });
          this.getRouter().initialize();
        }.bind(this))
        .catch(function (oError) {
          sap.ui.core.BusyIndicator.hide();
          sap.m.MessageToast.show(oError);
        });

      
      oApModel.attachMetadataFailed(function () {
        sap.ui.core.BusyIndicator.hide();
        sap.m.MessageToast.show('Connection to SAP Gateway is failed!!!');
      });


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
    },
    _callUserDetailsService: function (apModel) {

      return new Promise(function (resolve, reject) {
        console.log('Initiated user details service');
        apModel.read("/UserListSet", {
          filters: [new Filter('Xuser', FilterOperator.EQ, 'sy-uname')],
          success: function (oData, oResponse) {
            console.log('User details retrieved successfully');
            sap.ui.getCore().setModel(oData, 'userModel');
            resolve();
          },
          error: function (oError) {
            reject(oError);
          }
        });
      });
    },
    _callStatusSetServive: function (apModel) {
      return new Promise(function (resolve, reject) {
        console.log('Initiated status set service');
        apModel.read("/StatusSet", {
          success: function (oData, oResponse) {
            console.log('Status sets retrieved successfully');
            var oWebStatus = oData.results.filter(function (item) {
                return item.StatusNum.indexOf('WEB_') === 0;
              })
              .reduce(function (obj, item) {
                obj[item.StatusNum] = item.Description;
                return obj;
              }, {});
            sap.ui.getCore().setModel(oWebStatus, 'configModel');
            resolve(oWebStatus);
          },
          error: function (oError) {
            reject(oError);
          }
        });
      });
    },
  });
});