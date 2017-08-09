sap.ui.define([
  "com/dolphin/controller/BaseController",
  "sap/ui/model/json/JSONModel",
  "com/dolphin/util/Formatter",
  "sap/m/MessageToast"
], function (BaseController, JSONModel, Formatter, MessageToast) {
  "use strict";
  return BaseController.extend(
    "com.dolphin.controller.Detail", {
      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */
      /**
       * Called when the App view controller is instantiated.
       * @public
       */
      onInit: function () {
        this.setModel(new JSONModel(), 'viewModel');
        this.setModel(new JSONModel(), 'configModel');
        this.getRouter().getRoute("apDetail").attachPatternMatched(this._onPatternMatched, this);
      },
      /* =========================================================== */
      /* formatter methods                                           */
      /* =========================================================== */
      formatDate: function (date) {
      },
      formatURL:function(sUrl){
        return "<iframe style=\"border:none; overflow: hidden; height: 100%; width: 95%; position: absolute;\" height=\"100%\" width=\"100%\" src=" +
											sUrl + "></iframe>";
      },
      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */

      /* =========================================================== */
      /* Internal Methods                                            */
      /* =========================================================== */
      _onPatternMatched: function (oEvent) {
        this.getModel('configModel').setProperty('/WebConfig', sap.ui.getCore().getModel('configModel'));
        this.getModel('viewModel').setProperty('/UIModel', { 'CreateMode': true });
        var sRecNo = oEvent.getParameter("arguments").RecNo;
        this._callTracksService(sRecNo);
      },
      _callTracksService: function (sRecNo) {
        this.getOwnerComponent().getModel('apModel')
        .read("/Tracks('" + sRecNo + "')", {
          success: function (oData, oResponse) {
            this.getModel('viewModel').setProperty('/Tracks', oData);
          }.bind(this),
          error: function (oData, oResponse) {
            console.log(oResponse);
          }
        });
      }
    });
});