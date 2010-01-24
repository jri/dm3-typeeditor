function dm3_typeeditor() {

    add_topic_type("Topic Type", {
        fields: [
            {id: "type-id", model: {type: "text"}, view: {editor: "single line", label: "Type ID"}, content: ""},
            {id: "Fields",  model: {type: "field-definition"}}
        ],
        view: {},
        implementation: "PlainDocument"
    })

    // TODO: let this table build dynamically by installed plugins
    var FIELD_TYPES = {
        text: "Text",
        html: "Styled Text (HTML)",
        date: "Date",
        relation: "Relation"
    }

    var field_editors



    /**************************************************************************************************/
    /**************************************** Overriding Hooks ****************************************/
    /**************************************************************************************************/



    this.init = function() {
        var db_topic_types = load_topic_types()
        //
        // var load_count = 0
        // var save_count = 0
        //
        // 1) Make cached type definitions persistent for the first time (creating topic type topics).
        for (var type_id in topic_types) {
            if (!db_topic_types[type_id]) {
                save_topic_type(type_id, topic_types[type_id])
                // save_count++
            }
        }
        // 2) Extend and update the cached type definitions by the DB's type definitions.
        for (var type_id in db_topic_types) {
            // Note 1: we override all cached type definitions with the DB's version because
            // it might differ. This is the case if programatically created (through plugins)
            // type definitions are changed interactively.
            // Note 2: semantically this is an "update type" but functional there is no
            // difference to "add type"
            add_topic_type(type_id, db_topic_types[type_id])
            // load_count++
        }
        //
        // alert("dm3_typing.init: topic types:\n" + load_count +
        // " loaded from DB\n" + save_count + " saved to DB")
    }

    this.pre_create = function(doc) {
        if (doc.type == "Topic" && doc.topic_type == "Topic Type") {
            // Note: only types created interactively must be extended by an (empty)
            // type definition. Types created programatically (through plugins)
            // already have an type definition (which must not be overridden).
            if (!doc.type_definition) {
                doc.type_definition = {fields: [], view: {}, implementation: "PlainDocument"}
            }
        }
    }

    this.post_update = function(doc) {
        if (doc.type == "Topic" && doc.topic_type == "Topic Type") {
            // Note: semantically this is an "update type" but functional there is no
            // difference to "add type"
            var type_id = get_field(doc, "type-id").content
            add_topic_type(type_id, doc.type_definition)
        }
    }

    this.render_field_content = function(field, doc) {
        if (field.model.type == "field-definition") {
            var html = ""
            for (var i = 0, field; field = doc.type_definition.fields[i]; i++) {
                html += field.id + " (" + FIELD_TYPES[field.model.type] + ")<br>"
            }
            return html
        }
    }

    this.render_form_field = function(field, doc) {
        if (field.model.type == "field-definition") {
            var table = $("<table>").attr("id", "field-editors")
            //
            var add_field_button = ui.button("add-field-button", do_add_field, "Add Field", "circle-plus")
            //
            var form_field = $("<div>")
            form_field.append(table)
            form_field.append(add_field_button)
            return form_field
        }
    }

    this.post_render_form_field = function(field, doc) {
        if (field.model.type == "field-definition") {
            field_editors = []
            for (var i = 0, field; field = doc.type_definition.fields[i]; i++) {
                add_field_editor(field, i)
            }
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
            // update type definition (add, remove, and update fields)
            for (var i = 0, editor; editor = field_editors[i]; i++) {
                if (editor.field_is_new) {
                    // add field
                    doc.type_definition.fields.push(editor.get_new_field())
                } else if (editor.field_is_deleted) {
                    // delete field
                    remove_field(doc.type_definition, editor.field_id)
                } else if (editor.field_has_changed) {
                    // update field
                    editor.update_field()
                }
            }
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
        create_topic("Topic Type", {"type-id": type_id}, {type_definition: typedef})
    }

    function add_field_editor(field, i) {
        var field_editor = new FieldEditor(field, i)
        field_editors.push(field_editor)
        $("#field-editors").append(field_editor.dom)
    }

    function do_add_field() {
        // the default field is a single line text field, with yet empty ID and label
        var field = {id: "", model: {type: "text"}, view: {editor: "single line", label: ""}, content: ""}
        add_field_editor(field, field_editors.length)
    }

    function FieldEditor(field, editor_id) {

        var editor = this
        var delete_button = ui.button("deletefield-button_" + editor_id, do_delete_field, "", "circle-minus")
        var name_field = $("<input>").val(field.id)
        var fieldtype_menu_id = "fieldtype-menu_" + editor_id
        var td1 = $("<td>").append(delete_button)
        var td2 = $("<td>")
        td2.append("Name: ").append(name_field).append("<br>")
        td2.append("Type: ").append(fieldtype_menu())
        //
        this.field_id = field.id
        this.dom = $("<tr>").append(td1).append(td2)
        //
        this.field_is_new = !field.id
        this.field_is_deleted = false
        this.field_has_changed = field.id

        this.get_new_field = function() {
            return {
                id: to_id(get_fieldname()),
                model: {type: get_fieldtype()},
                view: {editor: "single line", label: get_fieldname()},
                content: ""
            }
        }

        this.update_field = function() {
            field.model.type = get_fieldtype()
            field.id = get_fieldname()
        }

        function get_fieldname() {
            return name_field.val()
        }

        function get_fieldtype() {
            return ui.menu_item(fieldtype_menu_id).value
        }

        function fieldtype_menu() {
            var fieldtype_menu = ui.menu(fieldtype_menu_id)
            // add items
            for (var fieldtype in FIELD_TYPES) {
                ui.add_menu_item(fieldtype_menu_id, {label: FIELD_TYPES[fieldtype], value: fieldtype})
            }
            // select item
            ui.select_menu_item(fieldtype_menu_id, field.model.type)
            //
            return fieldtype_menu
        }

        function do_delete_field() {
            // update GUI
            editor.dom.remove()
            // update model
            if (editor.field_has_changed) {
                editor.field_is_deleted = true
                editor.field_has_changed = false
            } else {
                editor.field_is_new = false
            }
        }
    }
}
