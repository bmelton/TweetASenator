Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) { 
        what = a[--L];
        while((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

jQuery(function($){
    $(document).keyup(function(e) {
        if (e.keyCode == 27) { // esc
            $("#mask").fadeOut();
            $(".modal").fadeOut();       
            $("#mask").remove();
        }
    });

    var token = $("[name='csrfmiddlewaretoken']").val();
    var oldSync = Backbone.sync;
    Backbone.sync = function(method, model, options) { 
        options.beforeSend = function(xhr) { 
            xhr.setRequestHeader('X-CSRFToken', token);
        };
        return oldSync(method, model, options);
    };

    Backbone.View.prototype.close = function(){
        this.remove();
        this.unbind();
        if (this.onClose){
            this.onClose();
        }
    }

    State   = Backbone.Model.extend({ });
    Senator = Backbone.Model.extend({ });
    Officer = Backbone.Model.extend({ });
    Tweet = Backbone.Model.extend({
        urlRoot: '/api/v1/tweets/'
    });

    States = Backbone.Collection.extend({ 
        model: State,
        initialize: function(model, options) { }
    });

    Officers = Backbone.Collection.extend({
        model: Officer,
        initialize: function(options) {
            // this.fetch();
        },
        url: function() { 
            return "/api/v1/representative/?position__in=1,2,3";
        },
        parse: function(resp) { 
            // return resp.objects;
        }
    });

    Senators = Backbone.Collection.extend({
        model: Senator,
        initialize: function(options) {
            this.state = options.state;
        },
        url: function() { 
            return "/api/v1/representative/?position=4&state=" + this.state;
        },
        parse: function(resp) { 
            return resp.objects;
        }
    });

    OfficerListView = Backbone.View.extend({
        el: $("#senators"),
        initialize: function(options) { 
            this.collection.on('sync', this.render, this);
        },
        render: function() { 
            var self = this;
            this.collection.each(function(item) { 
                var officerView = new OfficerView({model: item, el: item.id});
                $("#officers").append(officerView.render());
            });
            console.log("OfficersListView Render");
        },
    });

    SenatorListView = Backbone.View.extend({
        el: $("#content"),
        initialize: function(options) { 
            $("#senators").empty();
            $("#officers").empty();
            _.bindAll(this, 'render_officers');
            this.officers = options.officers;
            this.render_officers();
            // this.officers.on('sync', this.render_officers, this);
            // this.collection.on('sync', this.render, this);
            this.collection.on('remove', this.destroy, this);
            this.collection.fetch();
            this.collection.on('remove', this.destroy, this);
            this.collection.on('sync', this.render, this);
            $(this.el).undelegate('.officer', 'click');
            twitterers = [];
            $("#targets").val("");
        },
        render_officers: function() { 
            $("#officers").empty();
            if(this.options.state != 0) { 
                $(this.el).delegate('.officer', 'click', this.senatorClicked);
                this.officers.each(function(item) { 
                    var officerView = new OfficerView({model: item, el: item.id});
                    $("#officers").append(officerView.render());
                });
            };
        },
        render: function() {
            $("#senators").empty();
            //var self = this;
            if(this.options.state != 0) { 
                if(this.collection.length > 0) { 
                    this.collection.each(function(item) {
                        var senatorView = new SenatorView({model: item, el: item.id});
                        $("#senators").append(senatorView.render());
                    });
                } else {
                    var senatorEmptyView = new SenatorEmptyView();
                    $("#senators").append(senatorEmptyView.render());
                }
            } else { 
                var getStartedView = new GetStartedView();
                $("#senators").append(getStartedView.render());
            }
            return this;
        },
        events: {
            "click .senator" : "senatorClicked",
            "click .officer" : "senatorClicked",
        },
        senatorClicked: function(event) { 
            var self = this;
            var div = $(event.currentTarget);
            twitterer = div.find(".twitter").html();
            if(div.hasClass("selected")) {
                div.removeClass("selected");
                pos = twitterers.indexOf(twitterer);
                // twitterers.remove(twitterer);
                // twitterView = new TwitterersView({twitterers:twitterers});
            } else {
                twitterers.push(twitterer);
                twitterView = new TwitterersView({twitterers:twitterers});
                div.addClass("selected");
            }
            $("#targets").val(twitterers);
        },
        destroy: function(event) { 
            $(this.el).undelegate('.senator', 'click');
            $(this.el).delegate('.senator', 'click', this.senatorClicked);
        },
    });

    TwitterersView = Backbone.View.extend({
        el: $("#message"),
        initialize: function(options) { 
            if(logged_in) {
                this.template_name = "message_template"
                this.render();
            } else {
                this.template_name = "please_login_template";
                this.render();
            }
            $(this.el).undelegate('#submit_form', 'submit');
        },
        render: function() { 
            $(this.el).delegate('#submit_form', 'submit', this.formSubmitted);
            template= _.template($("#" + this.template_name).html());
            this.$el.html(template);
            return template;
        },
        events: {
            "keyup #id_message" : "handleKeys",
            "submit #submit_form" : "formSubmitted",
        },
        formSubmitted: function(event) { 
            event.preventDefault();
            var targets = $("#targets").val();
            var message = $("#id_message").val();
            var tweet = new Tweet({
                recipients: targets,
                message: message,
            });
            tweet.save({ wait: true }, {
                success: function(model, response, xhr) { 
                    router.navigate("", true);
                    $("#body").append("<div id='mask'></div>");
                    $("#mask").fadeIn(300);
                    var marginTop  = ($(".modal").height()+24)/2;
                    var marginLeft = ($(".modal").width()+24)/2;
                    $(".modal").css({
                        'margin-top' : -marginTop-100,
                        'margin-left': -marginLeft,
                    });
                    $(".modal").fadeIn(300);
                    console.log("Success");
                    console.log(model);
                    console.log(response);
                }, 
                error: function(model, response) { 
                    console.log("Error");
                    console.log(model);
                    console.log(response);
                }, 
            });
        },
        handleKeys : function(event) { 
            total = 110;
            counted = $("#id_message").val().length;
            result = total-counted;
            $("#letter_count").html("&nbsp;" + result + "&nbsp;");
            if(result < 0)
                $("#letter_count").addClass("error");
            else
                $("#letter_count").removeClass("error");
        }
    });

    SenatorView = Backbone.View.extend({ 
        template: _.template($("#senator_template").html()),
        // initialize: function() { },
        render: function() { 
            return this.template(this.model.toJSON());
        },
    });

    OfficerView = Backbone.View.extend({ 
        template: _.template($("#officer_template").html()),
        render: function() { 
            return this.template(this.model.toJSON());
        },
    });

    GetStartedView = Backbone.View.extend({
        template: _.template($("#get_started_template").html()),
        render: function() { 
            return this.template();
        }
    });

    SenatorEmptyView = Backbone.View.extend({
        template: _.template($("#senator_empty_template").html()),
        render: function() { 
            return this.template();
        }
    });

    AppView = Backbone.View.extend({ 
        el: $("#body"),
        initialize: function() { 
            this.states = new States(null, { view: this });
            for(var i = 0; i < states.length; i++) { 
                this.states.add(states[i]);
            };
            this.render();
        },
        render: function() { 
            var template = _.template($("#template").html(), { states: this.states, labelValue: 'Something'});
            $("#body").append(template);
        },
        events: { 
            "change #id_states" : "stateSelected",
        },
        stateSelected: function(event) {
            // api.nextSlide();
            selection = $(event.currentTarget);
            value = $("option:selected", selection).val();
            router.navigate(value, true);
        },
    });

    var TweetRouter = Backbone.Router.extend({ 
        routes: {
            ""  : "defaultRoute",
            "*state"    : "stateRoute",
        }
    });

    var router = new TweetRouter;

    if(this.appview != null) { 
        this.appview.off();
    }
    children = [];
    this.appview = new AppView();
    router.on('route:defaultRoute', function(actions) { 
        $("#id_states").val('0');
        $("#senators").children().fadeOut();
        $("#officers").children().fadeOut();
        $("#message").children().fadeOut();
        var getStartedView = new GetStartedView();
        $("#senators").append(getStartedView.render());
        // var appview = new AppView();
    });

    router.on('route:stateRoute', function(state) { 
        $("#id_states").val(state);
    
        this.senators = new Senators({state: state});
        this.officers  = new Officers({state: state});

        /*
        if(this.officerView != null) { 
            this.officerView.off();
        };
        */
        /*
        this.officerView = new OfficerListView({
            collection: this.officers, 
        });
        */

        this.officers = new Officers();
        this.officers.add([
            {id: 1, name: "Barack Obama", firstname: "Barack", lastname: "Obama", twitter: "BarackObama", party: "Democrat", pic: "/static/photos/thumbs/BarackObama.jpg", extra_title: "President of the United States" },
            {id: 2, name: "Joe Biden", firstname: "Joseph", lastname: "Biden", twitter: "JoeBiden", party: "Democrat", pic: "/static/photos/thumbs/JoeBiden.jpg", extra_title: "Vice President" },
            {id: 3, name: "John Boehner", firstname: "John", lastname: "Boehner", twitter: "SpeakerBoehner", party: "Republican", pic: "/static/photos/thumbs/JohnBoehner.jpg", extra_title: "Speaker of the House" },
        ]);
        if(this.senatorView != null) { 
            this.senatorView.off();
        };
        this.senatorView = new SenatorListView({
            collection: this.senators, 
            officers: this.officers,
            state: state 
        });
    });

    Backbone.history.start();
});
