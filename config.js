/* global tableau Vue */

let app = new Vue({
  el: "#app",
  data: {
    delimiter: ",",
    buttonLabel: "",
    worksheet: "",
    worksheets: [],
    fields: []
  },
  computed: {
    validConfig: function() {
      if (this.worksheet === "") return false;
      const selectedFields = this.fields.filter(field => field.selected);
      if (selectedFields.length === 0) return false;
      return true;
    }
  },
  methods: {
    getWorksheets: function() {
      const settings = tableau.extensions.settings.getAll();
      const worksheets =
        tableau.extensions.dashboardContent.dashboard.worksheets;
      this.worksheets = [...worksheets.map(w => w.name)];
      this.worksheet = worksheets.find(w => w.name === settings.worksheet)
        ? settings.worksheet
        : "";
    },
    getFields: async function(worksheetName) {
      const settings = tableau.extensions.settings.getAll();
      const selectedFields = settings.fields ? JSON.parse(settings.fields) : [];
      const worksheets =
        tableau.extensions.dashboardContent.dashboard.worksheets;
      const worksheet = worksheets.find(w => w.name === worksheetName);
      if (!worksheet) return (this.fields = []);
      const data = await worksheet.getSummaryDataAsync();
      this.fields = [
        ...data.columns.map(column => {
          const selected =
            selectedFields.find(
              field => field.selected && field.name === column.fieldName
            ) !== undefined;
          return { selected, name: column.fieldName };
        })
      ];
    },
    save: async function() {
      tableau.extensions.settings.set("delimiter", this.delimiter);
      tableau.extensions.settings.set("buttonLabel", this.buttonLabel);
      tableau.extensions.settings.set("worksheet", this.worksheet);
      tableau.extensions.settings.set("fields", JSON.stringify(this.fields));
      await tableau.extensions.settings.saveAsync();
      tableau.extensions.ui.closeDialog("");
    }
  },
  watch: {
    worksheet: function(worksheetName) {
      this.getFields(worksheetName);
    }
  },
  created: async function() {
    await tableau.extensions.initializeDialogAsync();
    this.getWorksheets();
    const settings = tableau.extensions.settings.getAll();
    this.buttonLabel = settings.buttonLabel
      ? settings.buttonLabel
      : "Copy selected data";
    this.delimiter = settings.delimiter
      ? settings.delimiter
      : ",";
  }
});
