function dm3_typeeditor() {

    add_topic_type("Topic Type", {
        fields: [
            {id: "type-id", model: {type: "text"}, view: {editor: "single line", label: "Type ID"}, content: ""},
            {id: "Icon",    model: {type: "relation", related_type: "Icon"}, view: {editor: "iconpicker"}},
            {id: "Fields",  model: {type: "field-definition"}}
        ],
        view: {
            icon_src: "vendor/dm3-typeeditor/images/drawer.png"
        },
        implementation: "PlainDocument"
    })

    // The type definition used for newly created topic types
    var DEFAULT_TYPE_DEFINITION = {
        fields: [
            {id: "Name",         model: {type: "text"}, view: {editor: "single line"}, content: ""},
            {id: "Description",  model: {type: "html"}, view: {editor: "multi line"},  content: ""}
        ],
        view: {},
        implementation: "PlainDocument"
    }

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
            // Note: we override all cached type definitions with the DB's version because it
            // might differ. This is the case if programatically created (through plugins)
            // type definitions are changed interactively.
            //
            // TODO: syncing type definitions is required in the other direction too!
            // Programatically created type definitions might be more up-to-date if
            // a plugin's type definition is modified by plugin developer.
            //
            add_topic_type(type_id, db_topic_types[type_id])    // Note: semantically this is an "update type" but
                                                                // functional there is no difference to "add type"
            // load_count++
        }
        //
        // alert("dm3_typing.init: topic types:\n" + load_count +
        // " loaded from DB\n" + save_count + " saved to DB")
    }

    this.pre_create = function(doc) {
        if (doc.type == "Topic" && doc.topic_type == "Topic Type") {
            // Note: types created interactively must be extended by an default type definition.
            // By contrast, types created programatically (through plugins) already have an
            // type definition (which must not be overridden).
            if (!doc.type_definition) {
                doc.type_definition = DEFAULT_TYPE_DEFINITION
            }
        }
    }

    /**
     * Once a "Topic Type" topic is updated we must
     * 1) Update the cached type definition.
     * 2) Rebuild the "Create" button's type menu.
     */
    this.post_update = function(doc) {
        if (doc.type == "Topic" && doc.topic_type == "Topic Type") {
            // 1) Update cached type definition
            var type_id = get_value(doc, "type-id")
            add_topic_type(type_id, doc.type_definition)    // Note: semantically this is an "update type" but
                                                            // functional there is no difference to "add type"
            // 2) Rebuild type menu
            rebuild_type_menu("create-type-menu")
        }
    }

    this.post_delete = function(doc) {
        if (doc.type == "Topic" && doc.topic_type == "Topic Type") {
            // 1) Update cached type definition
            var type_id = get_value(doc, "type-id")
            remove_topic_type(type_id)
            // 2) Rebuild type menu
            rebuild_type_menu("create-type-menu")
        }
    }

    this.render_field_content = function(field, doc) {
        if (field.model.type == "field-definition") {
            var content = $("<ul>")
            for (var i = 0, field; field = doc.type_definition.fields[i]; i++) {
                content.append($("<li>").text(field_label(field) + " (" + FIELD_TYPES[field.model.type] + ")"))
            }
            return content
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
            // update type definition (icon)
            var icon_src = $("#field_Icon img").attr("src")
            doc.type_definition.view.icon_src = icon_src
            // doc.view.icon_src = icon_src
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

    function do_add_field() {
        // the default field is a single line text field, with yet empty ID and label
        var field = {id: "", model: {type: "text"}, view: {editor: "single line", label: ""}, content: ""}
        add_field_editor(field, field_editors.length)
    }

    function add_field_editor(field, i) {
        var field_editor = new FieldEditor(field, i)
        field_editors.push(field_editor)
        $("#field-editors").append(field_editor.dom)
    }

    function FieldEditor(field, editor_id) {

        var editor = this
        var delete_button = ui.button("deletefield-button_" + editor_id, do_delete_field, "", "circle-minus")
        var fieldname_input = $("<input>").val(field_label(field))
        var fieldtype_menu = create_fieldtype_menu()
        var td1 = $("<td>").append(delete_button)
        var td2 = $("<td>")
        // - options area -
        // The options area holds fieldtype-specific GUI elements.
        // For text fields, e.g. the text editor menu ("single line" / "multi line")
        var options = clone(field)          // model
        var options_area = $("<span>")      // view
        var lines_input                     // view
        //
        td2.append("Field Name ").append(fieldname_input).append("<br>")
        td2.append("Type ").append(fieldtype_menu.dom).append(options_area)
        build_options_area()
        //
        this.field_id = field.id
        this.dom = $("<tr>").append(td1).append(td2)
        //
        this.field_is_new = !field.id       // Maximal one flag evaluates to true.
        this.field_is_deleted = false       // Note: all flags might evaluate to false. This is the case
        this.field_has_changed = field.id   // for newly added fields which are removed right away.

        this.get_new_field = function() {
            field.id = to_id(fieldname_input.val())
            update_field()
            return field
        }

        this.update_field = function() {
            update_field()
        }

        /**
         * Reads out the status of the GUI elements (view) and updates the field (model) accordingly.
         */
        function update_field() {
            field.model = options.model
            field.view = options.view
            // Note: the input fields must be read out manually
            // (for input fields the "options" model is not updated on-the-fly)
            field.view.label = fieldname_input.val()
            if (lines_input) {
                field.view.lines = lines_input.val()
            }
            //
            if (field.model.type == "relation") {
                options.view.editor = "checkboxes"
            }
        }

        function create_fieldtype_menu() {
            var menu_id = "fieldtype-menu_" + editor_id
            var menu = ui.menu(menu_id, fieldtype_changed)
            // add items
            for (var fieldtype in FIELD_TYPES) {
                menu.add_item({label: FIELD_TYPES[fieldtype], value: fieldtype})
            }
            // select item
            menu.select(field.model.type)
            //
            return menu
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

        function fieldtype_changed(menu_item) {
            options.model.type = menu_item.value
            //
            // FIXME: must adjust model here, e.g. when switching from "relation" to "text" -- not nice!
            // TODO: let the adjustment do by installed plugins.
            switch (options.model.type) {
            case "text":
                if (options.view.editor == "checkboxes") {
                    options.view.editor = "single line"
                }
                break
            case "html":
                break
            case "date":
                break
            case "relation":
                if (!options.model.related_type) {
                    options.model.related_type = keys(topic_types)[0]
                }
                break
            }
            //
            update_options_area()
        }

        function update_options_area() {
            options_area.empty()
            build_options_area()
        }

        function build_options_area() {
            // TODO: let the options area build by installed plugins
            switch (options.model.type) {
            case "text":
                // text editor menu
                build_texteditor_menu()
                // lines input
                if (options.view.editor == "multi line") {
                    build_lines_input()
                }
                break
            case "html":
                build_lines_input()
                break
            case "date":
                break
            case "relation":
                build_topictype_menu()
                break
            default:
                alert("ERROR at FieldEditor.build_options_area: unexpected field type (" + options.model.type + ")")
            }

            function build_texteditor_menu() {
                var texteditor_menu = ui.menu("texteditor-menu_" + editor_id, texteditor_changed)
                texteditor_menu.add_item({label: "Single Line", value: "single line"})
                texteditor_menu.add_item({label: "Multi Line", value: "multi line"})
                texteditor_menu.select(options.view.editor)
                //
                options_area.append(texteditor_menu.dom)

                function texteditor_changed(menu_item) {
                    options.view.editor = menu_item.value
                    update_options_area()
                }
            }

            function build_lines_input() {
                lines_input = $("<input>").attr("size", 3)
                lines_input.val(options.view.lines || DEFAULT_AREA_HEIGHT)
                //
                options_area.append("Lines ").append(lines_input)
            }

            function build_topictype_menu() {
                var topictype_menu = create_type_menu("topictype-menu_" + editor_id, topictype_changed)
                topictype_menu.select(options.model.related_type)
                //
                options_area.append(topictype_menu.dom)

                function topictype_changed(menu_item) {
                    options.model.related_type = menu_item.label
                }
            }
        }
    }
}
