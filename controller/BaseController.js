sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  'sap/m/Button',
  'sap/m/Dialog',
  'sap/m/List',
  'sap/m/StandardListItem',
  'sap/ui/model/Filter',
  'sap/ui/model/FilterOperator',
], function (Controller, JSONModel, Button, Dialog, List, StandardListItem, Filter, FilterOperator) {
  "use strict";
  var inputId = '';
  return Controller.extend(
    "com.dolphin.controller.BaseController", {
      handleValueHelp: function (oEvent) {
        this.inputId = oEvent.getSource().getId();
        var that = this,
          ovsService = '/' + oEvent.getSource().data("ovsService"),
          ovsId = oEvent.getSource().data("ovsIdField"),
          ovsDesc = oEvent.getSource().data("ovsDescField"),
          ovsTitle = oEvent.getSource().data("ovsTitle");
        this.setModel(new JSONModel({ ovsTitle: ovsTitle }), 'ovsModel');
        this
          .getOwnerComponent()
          .getModel('apModel')
          .read(ovsService, {
            success: function (oData) {
              oData.results.forEach(function (currentValue) {
                currentValue.ovsId = currentValue[ovsId];
                currentValue.ovsDesc = currentValue[ovsDesc];
              });
              that.getModel('ovsModel').setProperty('/results', oData.results);
            }.bind({ ovsId: ovsId, ovsDesc: ovsDesc, ovsTitle: ovsTitle }),
            error: function (oError) {

            }
          });
        if (!that.pressDialog) {
          that.pressDialog = sap.ui.xmlfragment("com.dolphin.view.fragment.OVS", this);
          //to get access to the global model
          this.getView().addDependent(that.pressDialog);
        }
        that.pressDialog.open();
      },
      handleSearch: function (oEvent) {
        var filterInput = this.getView().byId(this.inputId),
          ovsService = '/' + filterInput.data("ovsService"),
          ovsId = filterInput.data("ovsIdField"),
          ovsDesc = filterInput.data("ovsDescField"),
          ovsTitle = filterInput.data("ovsTitle"),
          ovsReqdValue = filterInput.data("ovsReqdField"),
          ovsReqdFilter = filterInput.data("ovsReqdFilter"),
          aFilter = [
            new Filter(filterInput.data("ovsIdField"), FilterOperator.EQ, oEvent.getParameter("value")),
            new Filter(filterInput.data("ovsDescField"), FilterOperator.EQ, oEvent.getParameter("value"))
          ],
          that = this;
        if (ovsReqdValue)
          aFilter.push(new Filter(ovsReqdFilter, FilterOperator.EQ, ovsReqdValue));
        this
          .getOwnerComponent()
          .getModel('apModel')
          .read(ovsService, {
            filters: aFilter,
            success: function (oData) {
              oData.results.forEach(function (currentValue) {
                currentValue.ovsId = currentValue[ovsId];
                currentValue.ovsDesc = currentValue[ovsDesc];
              });
              that.getModel('ovsModel').setProperty('/results', oData.results);
            }.bind({ ovsId: ovsId, ovsDesc: ovsDesc, ovsTitle: ovsTitle }),
            error: function (oError) {

            }
          });
      },
      handleClose: function (oEvent) {
        var aContexts = oEvent.getParameter("selectedContexts");
        if (aContexts) {
          var filterInput = this.getView().byId(this.inputId);
          filterInput.setValue(aContexts.map(function (oContext) {
            return oContext.getObject()[filterInput.data("ovsIdField")];
          }).join(", "));
          if(filterInput.data("ovsAdditionalField")){
            var additionalField = this.getView().byId(filterInput.data("ovsAdditionalField"));
            additionalField.setValue(aContexts.map(function (oContext) {
              return oContext.getObject()[filterInput.data("ovsDescField")];
            }).join(", "));
          }
        }
      },

      /**
       * Convenience method for accessing the router.
       * @public
       * @returns {sap.ui.core.routing.Router} the router for this component
       */
      getRouter: function () {
        return sap.ui.core.UIComponent
          .getRouterFor(this);
      },

      /**
       * Convenience method for getting the view model by name.
       * @public
       * @param {string} [sName] the model name
       * @returns {sap.ui.model.Model} the model instance
       */
      getModel: function (sName) {
        return this.getView().getModel(
          sName);
      },

      /**
       * Convenience method for setting the view model.
       * @public
       * @param {sap.ui.model.Model} oModel the model instance
       * @param {string} sName the model name
       * @returns {sap.ui.mvc.View} the view instance
       */
      setModel: function (oModel,
        sName) {
        return this.getView().setModel(
          oModel, sName);
      },

      /**
       * Getter for the resource bundle.
       * @public
       * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
       */
      getResourceBundle: function () {
        return this.getOwnerComponent()
          .getModel("i18n").getResourceBundle();
      },
      /**
     * Shows a message popup dialog in case of error
     * @params : oError
     */
      displayErrorPopup: function (oError) {
        sap.ui.core.BusyIndicator.hide();
        var title,errorMsg;
        if(oError.responseText){
          errorMsg=JSON.parse(oError.responseText).error.message.value;
          title=oError.message;
        }
        var dialog = new sap.m.Dialog({
          title:title,
          type: 'Message',
          state: 'Error',
          content: [new sap.m.Text({
            text: errorMsg
          })],
          beginButton: new sap.m.Button({
            text: 'OK',
            press: function () {
              dialog
                .close();
            }
          }),
          afterClose: function () {
            dialog.destroy();
          }
        });
        dialog.open();
      },
    });
});