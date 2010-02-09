
DeepaMehta 3 Type Editor Plugin
===============================

The DM3 Type Editor plugin allows interactive creation and modification of topic types. You can e.g. create a topic type "Book" along with its fields "Title", "Author", "Abstract", "Publication Date". Once the "Book" topic type is defined you can create books and search for books (type-based searching is provided by the optional DM3 Typing plugin).

Fields carries different types of data. There are 4 field types: *Text*, *Styled Text* (backed by a WYSIWYG editor), *Date* (backed by a datepicker widget), and *Relation*. The latter is special: a Relation field carries a relation to another topic. In the book example the "Author" field could carry a relation to a *Person* topic.

When the Type Editor plugin is installed you can also modify the topic types that already exist on your DeepaMehta 3 installation. These include the core topic types (like *Note*) as well as the topic types provided by other plugins (like *Person* and *Institution* as provided by DM3 Contact plugin).


Requirements
------------

* A DeepaMehta 3 installation  
  <http://github.com/jri/deepamehta3>

* Other DeepaMehta 3 plugins:

  - *DM3 Icons*  
    <http://github.com/jri/dm3-icons>  
    The DM3 Icons plugin let you attatch an icon to a topic type by means of an iconpicker widget.

  - *DM3 Typing* (optional install)  
    <http://github.com/jri/dm3-typing>  
    The DM3 Typing plugin provides a type-based search.


Installation
------------

1.  Go to your DeepaMehta 3 installation directory:
        cd deepamehta3

2.  Download the DM3 Type Editor plugin:
        couchapp vendor install git://github.com/jri/dm3-typeeditor.git

3.  Activate the plugin by adding one line to DeepaMehta's `_attachments/javascript/plugins.js`:
        add_plugin("vendor/dm3-typeeditor/script/dm3_typeeditor.js")

4.  Copy additional stuff:
        cp -r vendor/dm3-typeeditor/views/dm3-typeeditor_topictypes views

5.  Install the other DeepaMehta plugins (see Requirements) as described on the respective pages.

6.  Upload changes to CouchDB:
        couchapp push http://localhost:5984/deepamehta3-db

7.  Check if installation is successful: visit DeepaMehta 3 in your webbrowser (resp. press reload):  
    <http://localhost:5984/deepamehta3-db/_design/deepamehta3/index.html>  
    If you see the *Topic Type* entry in the *Create* menu (upper right corner) everything is OK.


Usage Hints
-----------

* Create a new topic type by choosing *Topic Type* from the Create menu and click the *Create* button. (A topic type is itself a topic and is represented on the canvas.) Enter a name for the topic type.

* Add a field by clicking the *Add Field* button. Name the field and choose its type. Four field types are available: *Text*, *Styled Text*, *Date*, and *Relation*. Depending on the field type set further field options, e.g. for Relation fields choose the related topic type.

* Remove a field by clicking the "Minus" button next to the field.

* When you're done with the type definition, click the *Save* button. The newly created type now appears in the Create menu -- ready for creating topics of that type.

* Delete a topic type by revealing it, and then delete it (just like any other topic).


Issues
------

* When you change a topic type definition, e.g. by renaming it, or by adding/removing fields, or even when you delete the topic type, all this doesn't affect existing topics of that type.

* No custom icons, e.g. a "Book" icon can be defined interactively yet.

* There is yet no custom icon representing a *Topic Type* itself.


------------
Jörg Richter  
Feb 9, 2010
