sap.ui.define([
  "com/dolphin/controller/BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator'
], function (BaseController, JSONModel, MessageToast, Filter, FilterOperator) {
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
        sap.ui.core.BusyIndicator.hide();
        this.getRouter().attachRouteMatched(this._onattachRouteMatched, this);
      },
      /* =========================================================== */
      /* formatter methods                                           */
      /* =========================================================== */
      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */
      handleTilePress: function (oEvent) {
        var oCtx = oEvent.getSource().getBindingContext('tiles'),
          sPath = oCtx.getPath() + '/id',
          sTileId = oCtx.getProperty(sPath);
        this.getRouter().navTo("resultTable", {
          navParam: sTileId
        });
      },
      /* =========================================================== */
      /* Internal Methods                                            */
      /* =========================================================== */
      _getCounts: function () {
        var aTiles = this.getOwnerComponent().getModel('tiles').getProperty('/results');
        aTiles[0].tiles.forEach(function (oTile) {
          if (oTile.countable) {
            oTile.busy = true;
            this.getOwnerComponent().getModel('tiles').refresh();
            this.getOwnerComponent()
              .getModel('apModel')
              .read('/Tracks/$count', {
                filters: [
                  new Filter(oTile.filterProperty, FilterOperator.EQ, oTile.filterValue),
                  new Filter('PTSMaxHits', FilterOperator.EQ, 1000000)
                ],
                success: function (sCount) {
                  // 		this.setModel(new JSONModel(oData), 'tracksModel');
                  // 		this.getModel('tracksModel').setProperty('/number', oData.results.length);
                  oTile.count = sCount;
                  oTile.busy = false;
                  this._contorller.getOwnerComponent().getModel('tiles').refresh();
                }.bind({
                  _contorller: this,
                  oTile: oTile
                }),
                error: function (oError) {
                  sap.ui.core.BusyIndicator.hide();
                }.bind(this)
              });
          } else {
            console.log();
          }
        }.bind(this));
      },
      _onattachRouteMatched: function (oEvent) {
        if (oEvent.getParameter('name') === 'home') {
          this._getCounts();
        }
      }
    });
});