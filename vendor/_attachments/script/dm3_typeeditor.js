function dm3_typeeditor() {

    add_topic_type("Topic Type", {
        fields: [
            {id: "type-id", model: {type: "text"}, view: {editor: "single line", label: "Type ID"}, content: ""},
            {id: "Fields",  model: {type: "field-definition"}}
        ],
        view: {},
        implementation: "PlainDocument"
    })



    /**************************************************************************************************/
    /**************************************** Overriding Hooks ****************************************/
    /**************************************************************************************************/



    this.init = function() {
        var db_topic_types = load_topic_types()
        //
        // var db_count = size(db_topic_types)
        // var save_count = 0
        // var add_count = 0
        //
        for (var type_id in topic_types) {
            if (!db_topic_types[type_id]) {
                save_topic_type(type_id, topic_types[type_id])
                // save_count++
            }
        }
        //
        for (var type_id in db_topic_types) {
            if (!topic_types[type_id]) {
                topic_types[type_id] = db_topic_types[type_id]
                // add_count++
            }
        }
        //
        // alert("dm3_typing.init: topic types:\n" + db_count + " loaded from DB\n" +
        //     save_count + " saved to DB\n" + add_count + " added to type menu")
    }

    this.pre_create = function(doc) {
        if (doc.type == "Topic" && doc.topic_type == "Topic Type") {
            // Note: only types created interactively must be extended by an (empty)
            // instance template. Types created programatically (through plugins)
            // already have an instance template (which must not be overridden).
            if (!doc.instance_template) {
                doc.instance_template = {fields: [], view: {}, implementation: "PlainDocument"}
            }
        }
    }

    this.render_field_content = function(field, doc) {
        if (field.model.type == "field-definition") {
            var html = ""
            for (var i = 0, field; field = doc.instance_template.fields[i]; i++) {
                html += field.id + "<br>"
            }
            return html
        }
    }

    this.render_form_field = function(field, doc) {
        if (field.model.type == "field-definition") {
            var table = $("<table>")
            for (var i = 0, field; field = doc.instance_template.fields[i]; i++) {
                var delete_button = ui.button("delete-field-" + field.id, do_delete_field, "", "circle-minus")
                var name_field = $("<input>").attr("id", "name_field_" + field.id).val(field.id)
                var td1 = $("<td>").append(delete_button)
                var td2 = $("<td>").append("Name: ").append(name_field).append("<br>")
                td2.append("Type: ").append(fieldtype_menu(field))
                table.append($("<tr>").append(td1).append(td2))
            }
            return table
        }

        function fieldtype_menu(field) {
            var menu_id = "fieldtype_menu_" + field.id
            var fieldtype_menu = ui.menu(menu_id)
            // TODO: let installed plugins build the menu dynamically
            ui.add_menu_item(menu_id, {label: "Text", value: "text"})
            ui.add_menu_item(menu_id, {label: "Styled Text (HTML)", value: "html"})
            ui.add_menu_item(menu_id, {label: "Date", value: "date"})
            ui.add_menu_item(menu_id, {label: "Relation", value: "relation"})
            return fieldtype_menu
        }
    }

    this.get_field_content = function(field) {
        if (field.model.type == "field-definition") {
            // prevent this field from being updated
            return null
        }
    }

    this.pre_submit_form = function(doc) {
        if (doc.topic_type == "Topic Type") {
            for (var i = 0, field; field = doc.instance_template.fields[i]; i++) {
                field.model.type = ui.menu_item("fieldtype_menu_" + field.id).value
                field.id = $("#name_field_" + field.id).val()
            }
            // ### remove_field(doc, "Fields")
        }
    }



    /************************************************************************************************/
    /**************************************** Custom Methods ****************************************/
    /************************************************************************************************/



    function load_topic_types() {
        var rows = db.view("deepamehta3/dm3-typeeditor_topictypes").rows
        var topic_types = []
        for (var i = 0, row; row = rows[i]; i++) {
            topic_types[row.key] = row.value
        }
        return topic_types
    }

    function save_topic_type(type_id, typedef) {
        create_topic("Topic Type", {"type-id": type_id}, {instance_template: typedef})
    }

    function create_field_editor(field_id) {
    }

    function do_delete_field() {
        alert("do_delete_field: " + arguments.length + " arguments")
    }
}
