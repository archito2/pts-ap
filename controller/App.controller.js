sap.ui.define([
  "com/dolphin/controller/BaseController",
  "sap/ui/model/json/JSONModel"
], function(BaseController,
  JSONModel) {
  "use strict";
  return BaseController.extend(
    "com.dolphin.controller.App", {
      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */
      /**
       * Called when the App view controller is instantiated.
       * @public
       */
      onInit: function() {
        var oViewModel,
          fnSetAppNotBusy,
          iOriginalBusyDelay =
          this.getView()
          .getBusyIndicatorDelay(),
          userModel = new sap.ui.model.json.JSONModel("/services/userapi/currentUser");
        oViewModel = new JSONModel({
          busy: true,
          delay: 0
        });
        this.getView()
          .setModel(userModel, "userapi");
        this.setModel(
          oViewModel,
          "appView");
        fnSetAppNotBusy =
          function() {
            oViewModel.setProperty(
              "/busy", false);
            oViewModel.setProperty(
              "/delay",
              iOriginalBusyDelay
            );
          };
        this.getOwnerComponent()
          .getModel()
          .metadataLoaded()
          .then(fnSetAppNotBusy);
        // apply content density mode to root view
        this.getView()
          .addStyleClass(
            this.getOwnerComponent()
            .getContentDensityClass()
          );
        // Hacking the dolphin header to show version number
        var DolShell = this.byId("myShell-header"),
          version = this.getOwnerComponent()
          .getMetadata()
          .getVersion();
        if(DolShell) {
          DolShell.addDelegate({
            onAfterRendering: function() {
              $("#" + this.getId() + "-icon")
                .attr("alt", version);
              $("#" + this.getId() + "-icon")
                .attr("title", version);
            }
          }, false, DolShell, true);
        }
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
      }
    });
});