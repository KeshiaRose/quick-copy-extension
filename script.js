/* global tableau Vue */

let app = new Vue({
  el: "#app",
  data: {
    delimiter: ",",
    buttonLabel: "",
    validConfig: true,
    unregister: () => {},
    markCount: 0
  },
  methods: {
    configure: async function() {
      try {
        const url = `${window.location.origin}/config.html`;
        await tableau.extensions.ui.displayDialogAsync(url, "", {
          width: 500,
          height: 600
        });
        this.setup();
      } catch (error) {
        switch (error.errorCode) {
          case tableau.ErrorCodes.DialogClosedByUser:
            console.log("Dialog was closed by user.");
            break;
          default:
            console.error(error.message);
        }
      }
    },
    copy: async function() {
      const settings = tableau.extensions.settings.getAll();
      const worksheets =
        tableau.extensions.dashboardContent.dashboard.worksheets;
      const worksheet = worksheets.find(ws => ws.name === settings.worksheet);
      const selectedFields = JSON.parse(settings.fields);
      if (!worksheet || !selectedFields) return (this.validConfig = false);
      const marks = await worksheet.getSelectedMarksAsync();
      const data = marks.data[0];
      let indexes = [];
      for (let field of selectedFields) {
        if (field.selected) {
          const column = data.columns.find(
            column => column.fieldName === field.name
          );
          if (!column) return (this.validConfig = false);
          indexes.push(column.index);
        }
      }
      if (indexes.length === 0) return (this.validConfig = false);
      let output = [];
      for (let mark of data.data) {
        let markData = [];
        for (let index of indexes) {
          markData.push(mark[index].formattedValue);
        }
        let row;

        if (btoa(this.delimiter) === "XHQ=") {
          row = markData.join("\t");
        } else if (btoa(this.delimiter) === "XG4=") {
          row = markData.join("\n");
        } else {
          row = markData.join(this.delimiter);
        }
        output.push(row);
      }

      let input = document.createElement("textarea");
      input.value = output.join("\n");
      document.body.appendChild(input);
      input.select();
      let result = document.execCommand("copy");
      document.body.removeChild(input);
    },
    countMarks: async function(marksEvent) {
      const data = await marksEvent.getMarksAsync();
      this.markCount = data.data[0].data.length;
    },
    listen: function() {
      const settings = tableau.extensions.settings.getAll();
      const dashboard = tableau.extensions.dashboardContent.dashboard;
      const worksheet = dashboard.worksheets.find(
        w => w.name === settings.worksheet
      );
      if (!worksheet) return (this.validConfig = false);
      this.unregister();
      this.unregister = worksheet.addEventListener(
        tableau.TableauEventType.MarkSelectionChanged,
        this.countMarks
      );
    },
    setup: function() {
      this.validConfig = true;
      const settings = tableau.extensions.settings.getAll();
      this.buttonLabel = settings.buttonLabel || "";
      this.delimiter = settings.delimiter || ",";
      this.listen();
    }
  },
  watch: {},
  created: async function() {
    await tableau.extensions.initializeAsync({ configure: this.configure });
    this.setup();
  }
});
