$(function () {
    Backbone.history.start();

    var contacts = [
        {
            name: 'Contact 1',
            address: '1, a street, a town, a city, AB12 3CD',
            tel: '0123456789',
            email: 'test@example.com',
            type: 'family'
        },
        {
            name: 'Contact 2',
            address: '1, a street, a town, a city, AB12 3CD',
            tel: '0123456789',
            email: 'test@example.com',
            type: 'family'
        },
        {
            name: 'Contact 3',
            address: '1, a street, a town, a city, AB12 3CD',
            tel: '0123456789',
            email: 'test@example.com',
            type: 'friend'
        },
        {
            name: 'Contact 4',
            address: '1, a street, a town, a city, AB12 3CD',
            tel: '0123456789',
            email: 'test@example.com',
            type: 'colleague'
        },
        {
            name: 'Contact 5',
            address: '1, a street, a town, a city, AB12 3CD',
            tel: '0123456789',
            email: 'test@example.com',
            type: 'family'
        },
        {
            name: 'Contact 6',
            address: '1, a street, a town, a city, AB12 3CD',
            tel: '0123456789',
            email: 'test@example.com',
            type: 'colleague'
        },
        {
            name: 'Contact 7',
            address: '1, a street, a town, a city, AB12 3CD',
            tel: '0123456789',
            email: 'test@example.com',
            type: 'friend'
        },
        {
            name: 'Contact 8',
            address: '1, a street, a town, a city, AB12 3CD',
            tel: '0123456789',
            email: 'test@example.com',
            type: 'family'
        }
    ];

    var Contact = Backbone.Model.extend({
        defaults: {
            name: "",
            address: "",
            tel: "",
            email: "",
            type: "",
            photo: 'img/placeholder.png'
        }
    });

    var Directory = Backbone.Collection.extend({
        model: Contact
    });

    var ContactView = Backbone.View.extend({
        tagName: 'article',
        className: 'contact-container',
        template: $('#contactTemplate').html(),
        editTemplate: _.template($("#contactEditTemplate").html()),

        events: {
            'click button.delete': 'deleteContact',
            "click button.edit": "editContact",
            "change select.type": "addType",
            "click button.save": "saveEdits",
            "click button.cancel": "cancelEdit"
        },

        render: function () {
            var tmpl = _.template(this.template);

            this.$el.html(tmpl(this.model.toJSON()));
            return this;
        },

        deleteContact: function () {
            var removedType = this.model.get('type').toLowerCase();
            this.model.destroy();
            this.remove();

            if (_.indexOf(directory.getTypes(), removedType) === -1) {
                directory.$el.find("#filter select").children("[value='" + removedType + "']").remove();
            }
        },

        editContact: function () {
            this.$el.html(this.editTemplate(this.model.toJSON()));

            var newOpt = $('<option/>', {
                html: '<em>Add new...</em>',
                value: 'addType'
            });

            this.select = directory.createSelect().addClass('type')
                .val(this.$el.find('#type').val()).append(newOpt)
                .insertAfter(this.$el.find('.name'));

            this.$el.find('input[type=\'hidden\']').remove();

        },

        addType: function () {
            if (this.select.val() == 'addType') {
                this.select.remove();

                $('<input />', {
                    class: 'type'
                }).insertAfter(this.$el.find('.name')).focus();
            }
        },

        saveEdits: function (e) {
            e.preventDefault();

            var formData = {};

            $(e.target).closest('form').find(':input').add('.photo').each(function () {
                var el = $(this);
                formData[el.attr('class')] = el.val();
            });

            if (formData['photo'] === '') {
                delete formData.photo;
            }

            this.model.set(formData);

            var prev = this.model.previousAttributes();

            this.render();

            if (prev.photo === 'img/placeholder.png') {
                delete prev.photo;
            }

            _.each(contacts, function (contact) {
                if (_.isEqual(contact, prev)) {
                    contacts.splice(_.indexOf(contacts, contact), 1, formData);
                }
            });

            directory.updateSelect();
        },

        cancelEdit: function () {
            this.render();
        }
    });

    var DirectoryView = Backbone.View.extend({
        el: $('#contacts'),

        initialize: function () {
            this.collection = new Directory(contacts);

            this.$el.find('#filter').append(this.createSelect());
            this.on("change:filterType", this.filterByType, this);

            this.collection.on("reset", this.render, this);
            this.collection.on("add", this.render, this);
            this.collection.on("remove", this.removeContact, this);

            this.render();
        },

        render: function () {
            this.$el.find("article").remove();

            _.each(this.collection.models, function (item) {
                this.renderContact(item);
            }, this);
        },

        renderContact: function (item) {
            var contactView = new ContactView({
                model: item
            });

            this.$el.append(contactView.render().el);
        },

        getTypes: function () {
            return _.uniq(this.collection.pluck('type'), false, function (type) {
                return type.toLowerCase();
            })
        },

        createSelect: function () {
            var filter = this.$el.find('#filter');
            var select = $('<select/>', {
                html: '<option>all</option>'
            });

            _.each(this.getTypes(), function (item) {
                var selected = false;
                if (Backbone.history.fragment === item.toLowerCase()) {
                    selected = true;
                }

                var option = $('<option/>', {
                    value: item.toLowerCase(),
                    text: item.toLowerCase(),
                    selected: selected
                }).appendTo(select);
            });

            return select;
        },

        updateSelect: function () {
            this.$el.find('#filter select').remove();
            this.$el.find('#filter').append(this.createSelect());
        },

        events: {
            'change #filter select': 'setFilter',
            'click #add': 'addContact',
            'click #showForm': 'showForm',
        },

        setFilter: function (e) {
            this.filterType = e.currentTarget.value.toLowerCase();
            this.trigger('change:filterType');
        },

        filterByType: function () {
            if (this.filterType === 'all') {
                this.collection.reset(contacts);
                contactsRouter.navigate("all");
            } else {
                this.collection.reset(contacts, {silent: true});

                var filterType = this.filterType;
                var filtered = _.filter(this.collection.models, function (item) {
                    return item.get('type').toLowerCase() === filterType;
                });

                this.collection.reset(filtered);
                contactsRouter.navigate(filterType);
            }
        },

        addContact: function (e) {
            e.preventDefault();

            var newModel = {};

            $('#addContact').children('input').each(function (i, el) {
                if ($(el).val() != "") {
                    newModel[el.id] = $(el).val();
                }
            })

            contacts.push(newModel);

            if (_.indexOf(this.getTypes(), newModel.type) === -1) {
                this.collection.add(new Contact(newModel));
                this.$el.find('#filter').find('select').remove().end().append(this.createSelect());
            } else {
                this.collection.add(new Contact(newModel));
            }

            $('#addContact').trigger('reset');
        },

        removeContact: function (removedModel) {
            var removed = removedModel.attributes;

            if (removed.photo === 'img/placeholder.png') {
                delete removed.photo;
            }

            _.each(contacts, function (contact) {
                if (_.isEqual(contact, removed)) {
                    contacts.splice(_.indexOf(contacts, contact), 1);
                }
            });
        },

        showForm: function () {
            this.$el.find('#addContact').slideToggle();
        }
    });

    var ContactsRouter = Backbone.Router.extend({
        routes: {
            ':type': 'urlFilter'
        },
        urlFilter: function (type) {
            directory.filterType = type;
            directory.trigger('change:filterType');
        }
    });

    var directory = new DirectoryView();
    var contactsRouter = new ContactsRouter();

    $('#filter select').trigger('change');
});