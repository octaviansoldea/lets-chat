//
// LCB Views
//

//
// Rooms List
//
var RoomsBrowserView = Backbone.View.extend({
    events: {
        'click .lcb-rooms-list-item-close': 'leave'
    },
    initialize: function(options) {
        this.client = options.client;
        this.template = Handlebars.compile($('#template-room-browser-item').html());
        this.rooms = options.rooms;
        this.rooms.on('add', function(room) {
            this.$el.find('.lcb-rooms-list').append(this.template(room.toJSON()));
        }, this);
        return this;
    },
    leave: function(e) {
        e.preventDefault();
        var id = $(e.currentTarget).closest('[data-id]').data('id');
        this.client.events.trigger('rooms:leave', id);
    }
});

//
// Rooms
//
var RoomsView = Backbone.View.extend({
    initialize: function(options) {
        this.client = options.client;
        this.template = Handlebars.compile($('#template-room').html());
        this.rooms = options.rooms;
        this.views = {};
        this.rooms.on('change:joined', function(room, joined) {
            // Joined room?
            if (joined) {
                this.add(room);
                return;
            }
            // We need to make sure room is gone
            if (joined === false) {
                this.remove(room.id);
                return;
            }
        }, this);
        // Switch room
        this.rooms.current.on('change:id', function(current, id) {
            this.switch(id);
        }, this);
        return this;
    },
    switch: function(id) {
        this.$el.find('[data-id=' + id + ']').show()
            .siblings().hide();
    },
    add: function(room) {
        if (this.views[room.id]) {
            // Nothing to do, this room is already here
            return;
        }
        this.views[room.id] = new RoomView({
            client: this.client,
            template: this.template,
            model: room
        });
        this.$el.append(this.views[room.id].$el);
    },
    remove: function(id) {
        if (!this.views[id]) {
            // Nothing to do here
            return;
        }
        this.views[id].destroy();
    }
});

//
// Room
//
var RoomView = Backbone.View.extend({
    events: {
        'keypress .lcb-entry-input': 'sendMessage'
    },
    initialize: function(options) {
        this.template = options.template;
        this.messageTemplate = Handlebars.compile($('#template-message').html());
        this.render();
        this.model.on('messages:new', this.addMessage, this);
        return this;
    },
    render: function() {
        this.$el = $(this.template(this.model.toJSON()))
        this.$messages = this.$el.find('.lcb-messages');
        return this;
    },
    sendMessage: function(e) {
        if (e.type === 'keypress' && e.keyCode !== 13 || e.altKey) return;
        e.preventDefault();
        var $textarea = this.$('.lcb-entry-input');
        if (!$textarea.val()) return;
        client.events.trigger('messages:send', {
            room: this.model.id,
            text: $textarea.val()
        });
        $textarea.val('');
    },
    addMessage: function(message) {
        this.$messages.append(this.messageTemplate(message));
    },
    destroy: function() {
        this.undelegateEvents();
        this.$el.removeData().unbind();
        this.remove();
        Backbone.View.prototype.remove.call(this);
    }
});

//
// Client
//
var ClientView = Backbone.View.extend({
    el: '#lcb-client',
    initialize: function(options) {
        this.client = options.client;
        //
        // Subviews
        //
        this.roomsBrowser = new RoomsBrowserView({
            el: this.$el.find('.lcb-rooms-browser'),
            rooms: this.client.rooms,
            client: this.client
        });
        this.rooms = new RoomsView({
            el: this.$el.find('.lcb-rooms'),
            rooms: this.client.rooms,
            client: this.client
        });
        return this;
    }
});