/** section: Exposition
 * class System.Exposition
 * Cette classe gère les interfaces des expositions.
 **/
System.Exposition = {
    VERSION:	0.1,
    /**
     * new System.Exposition() -> void
     *
     * Cette méthode créée une nouvelle instance du gestionnaire des tâches.
     **/
    initialize: function(){

        //this.ExpensesManager = new ExpensesManager();

        System.observe('expo:submit.complete', function(task){
            if(!Object.isUndefined(this.winList)){
                this.winList.load();
            }
        }.bind(this));

        System.observe('expo:remove.complete', function(task){
            if(!Object.isUndefined(this.winList)){
                this.winList.load();
            }
        }.bind(this));

        System.observe('system:startinterface', this.startInterface.bind(this));

        System.observe('system:external.open', function(win, obj){
            var title = win.Title();
            if(title.slice(0,3) == 'mc_'){
                win.setIcon('file-edit');
                win.Title($MUI('TinyMCE'));
                win.resizeTo(obj.width, obj.height);
                win.moveTo(0, obj.top);
                win.Cacheable(false);
                win.Resizable(false);
            }
        });

        System.observe('expense:submit.complete', function(){
            if(Object.isFunction(this.win.loadNote)) this.win.loadNote();
        }.bind(this));

        //System.observe('notify:draw', this.listNotify.bind(this));
    },
    /**
     * ExpositionsManager.startInterface() -> void
     *
     * Cette méthode liste les procédures à effectuer lors du lancement de l'interface d'administration.
     **/
    startInterface:function(){
        System.DropMenu.addMenu($MUI('Expositions'), {icon:'cal'}).on('click', function(){this.listNotFinish()}.bind(this));
        System.DropMenu.addLine($MUI('Expositions'), $MUI('Ajouter'), {icon:'add', border:true, bold:true}).on('click', function(){this.open()}.bind(this));
        System.DropMenu.addLine($MUI('Expositions'), $MUI('Listing des prochaines expositions'), {icon:'1right'}).on('click', function(){this.listNotFinish()}.bind(this));
        System.DropMenu.addLine($MUI('Expositions'), $MUI('Listing des expositons terminées'), {icon:'valid', border:true}).on('click', function(){this.listFinish()}.bind(this));
        System.DropMenu.addLine($MUI('Expositions'), $MUI('Listing complet'), {icon:'list'}).on('click', function(){this.listing()}.bind(this));
    },
    /**
     * System.Exposition.open(task) -> void
     *
     * Ouvre un nouveau formulaire des tâches.
     **/
    open: function(expo){

        var win = $WR.unique('exposition', {
            autoclose:	true,
            action: function(){
                this.open(expo);
            }.bind(this)
        });
        //on regarde si l'instance a été créée
        if(!win) return;

        win.overideClose({
            submit:this.submit.bind(this),
            change:this.checkChange.bind(this),
            close: function(){this.win = null}.bind(this)
        });

        win.expo = new Exposition(expo);
        //
        //forms
        //
        var forms =		{};
        //
        // Window
        //
        win.createTabControl({type:'top'})
        win.createBox();
        win.createFlag().setType(FLAG.RIGHT);
        win.Resizable(false);
        win.NoChrome(true);
        win.setIcon('cal');
        win.createHandler($MUI('Chargement en cours'), true);

        win.forms = 	forms;
        this.win = 		win;

        forms.submit = 		new SimpleButton({text:$MUI('Enregistrer'), type:'submit'}).on('click', function(){this.submit(win)}.bind(this));
        forms.close = 		new SimpleButton({text:$MUI('Fermer')}).on('click', function(){win.close();}.bind(this));

        //
        //TabControl
        //
        win.TabControl.addPanel($MUI('Informations'), this.createPanel(win)).setIcon('cal');
        win.TabControl.addPanel($MUI('Description'), this.createPanelDescription(win)).setIcon('file-edit');

        win.Footer().appendChild(forms.submit);
        win.Footer().appendChild(forms.close);

        document.body.appendChild(win);

        forms.Description.load();

        System.fire('expo:open', win);

    },
    /**
     * createPanel(win) -> Panel
     *
     **/
    createPanel: function(win){

        var splite = 	new SpliteIcon($MUI('Informations générales de l\'exposition'), $MUI('Modifier les champs suivants pour personnaliser l\'exposition') + ' :');
        splite.setIcon('cal-48');
        //
        // Panel
        //
        var panel = 	new Panel();
        //
        // Titre
        //
        win.forms.Title =			new Input({type:'text', style:'width:100%', value:win.expo.Title});
        //
        // DateCrea
        //
        win.forms.DateDep =			new InputCalendar({type:'select'});
        win.forms.DateDep.activeHours(15);
        win.forms.DateDep.setDate(win.expo.DateDep.clone());
        //
        // DateReal
        //
        win.forms.DateRet =			new InputCalendar({type:'select'});
        win.forms.DateRet.activeHours(15);
        win.forms.DateRet.addInputCalendar(win.forms.DateDep);
        win.forms.DateRet.setDate(win.expo.DateRet.clone());
        //
        // Adresse
        //
        win.forms.Adresse =			new Input({type:'text', style:'width:100%', value:win.expo.Adresse});
        //
        // Adresse2
        //
        win.forms.Adresse2 =		new Input({type:'text', style:'width:100%', value:win.expo.Adresse2});
        //
        // CodePostal
        //
        win.forms.CP = 				new InputCP();
        win.forms.CP.Text(win.expo.CP);
        win.forms.CP.setStyle('width:80px');
        //
        // Ville
        //
        win.forms.Ville = 			new InputCity();
        win.forms.Ville.setInputCP(win.forms.CP);
        win.forms.Ville.Text(win.expo.Ville);
        win.forms.Ville.setStyle('width:200px');
        //
        // MontantHT
        //
        win.forms.MontantHT = 	new Node('p', {style:'text-align:right;width:80px; border:1px solid #CCC; padding:5px;'}, '0.00 €');
        win.forms.MontantTTC = 	new Node('p', {style:'text-align:right;width:80px; border:1px solid #CCC; padding:5px;'}, '0.00 €');

        //
        // Table
        //
        var widget1 = new TableData();

        widget1.addHead($MUI('Titre') + ' : ', {width:130}).addField(win.forms.Title).addRow();
        widget1.addHead($MUI('Date de début') + ' : ').addField(win.forms.DateDep).addRow();
        widget1.addHead($MUI('Date de fin') + ' : ').addField(win.forms.DateRet);
        //
        //
        //
        var widget2 = new TableData();

        widget2.addHead($MUI('Adresse') + ' : ', {width:130}).addField(win.forms.Adresse).addRow();
        widget2.addHead(' ').addField(win.forms.Adresse2).addRow();
        widget2.addHead($MUI('Code Postal') + ' : ').addField(win.forms.CP).addRow();
        widget2.addHead($MUI('Ville') + ' : ').addField(win.forms.Ville);

        win.forms.Title.on('mouseover', function(){
            win.Flag.setText('<p class="icon-documentinfo">' + $MUI('Saisissez ici <b>le titre</b> de votre exposition') + '.</p>').color('grey').setType(FLAG.RIGHT).show(this, true);
        });

        win.forms.Adresse.on('mouseover', function(){
            win.Flag.setText('<p class="icon-documentinfo">' + $MUI('Saisissez ici <b>l\'adresse</b> de votre exposition') + '.</p>').color('grey').setType(FLAG.RIGHT).show(this, true);
        });

        win.forms.Adresse2.on('mouseover', function(){
            win.Flag.setText('<p class="icon-documentinfo">' + $MUI('Saisissez ici <b>le complétement d\'adresse</b> de votre exposition') + '.</p>').color('grey').setType(FLAG.RIGHT).show(this, true);
        });

        win.forms.CP.on('mouseover', function(){
            win.Flag.setText('<p class="icon-documentinfo">' + $MUI('Saisissez ici <b>le code postal</b> de votre exposition') + '.</p>').color('grey').setType(FLAG.RIGHT).show(this, true);
        });

        win.forms.Ville.on('mouseover', function(){
            win.Flag.setText('<p class="icon-documentinfo">' + $MUI('Saisissez ici <b>la ville</b> de votre exposition') + '.</p>').color('grey').setType(FLAG.RIGHT).show(this, true);
        });

        win.forms.DateDep.on('mouseover', function(){
            win.Flag.setText('<p class="icon-documentinfo">' + $MUI('Choisissez une <b>date de début</b> pour votre exposition') + '.</p>').color('grey').setType(FLAG.RIGHT).show(this, true);
        });

        win.forms.DateRet.on('mouseover', function(){
            win.Flag.setText('<p class="icon-documentinfo">' + $MUI('Choisissez une <b>date de fin</b> pour votre exposition') + '.</p>').color('grey').setType(FLAG.RIGHT).show(this, true);
        });

        panel.appendChild(splite);
        panel.appendChild(widget1);
        panel.appendChild(widget2);

        return panel;
    },
    /**
     * EvenementsManager.createPanelDescription(win) -> Node
     * - win (Window): Instance de Window.
     *
     * Cette méthode crée le panneau permettant de personnaliser la description d'un événement.
     **/
    createPanelDescription: function(win){
        //
        //
        //
        var panel = 	new Panel({style:'padding:0'});
        //
        // Description
        //
        win.forms.Description =		new Editor({width:'100%', height:'400px', media:$FM().createHandler()});
        win.forms.Description.Value(win.expo.Description);

        panel.appendChild(win.forms.Description);

        return panel;
    },
    /**
     * System.Exposition.checkChange(win) -> Boolean
     * - win (Window): Instance du formulaire.
     *
     * Cette méthode vérifie l'état du formulaire et retourne vrai si le formulaire a été modifié, faux dans le cas de contraire.
     **/
    checkChange:function(win){
        var last = 		win.expo.clone();
        var current =	win.expo.clone();

        current.Title = 		win.forms.Title.value;
        current.DateDep = 		win.forms.DateDep.getDate();
        current.DateRet = 		win.forms.DateRet.getDate();
        current.Adresse = 		win.forms.Adresse.value;
        current.Adresse2 = 		win.forms.Adresse2.value;
        current.Ville = 		win.forms.Ville.Text();
        current.CP = 			win.forms.CP.Text();
        current.Description = 	win.forms.Description.Value();


        return (function(o, n){

            for(var key in o){
                if(Object.isFunction(o[key])) continue;
                if(key == 'DateDep' || key == 'DateRet'){
                    if(o[key].toString_('datetime') != n[key].toString_('datetime')){
                        return true;
                    }
                    continue;
                }
                if(o[key] != n[key]){
                    System.trace(key);
                    return true;
                }
            }
            return false;

        })(last, current);
    },
    /**
     * System.Exposition.submit(win) -> void
     *
     * Valide et enregistre le formulaire de la fenêtre `win`.
     **/
    submit: function(win, noclose){

        noclose = Object.isUndefined(noclose) ? false : noclose;

        win.Flag.hide();
        win.AlertBox.hide();

        if(win.forms.Title.value == ''){
            win.Flag.setText($MUI('Veuillez saisir un titre pour cette exposition')).show(win.forms.Title);
            return;
        }

        var evt = new StopEvent(win);
        System.fire('expo:open.submit', evt);

        if(evt.stopped) return true;

        var newObj =			win.expo.Event_ID == 0;
        var current = 			win.expo.clone();

        current.Title = 		win.forms.Title.value;
        current.DateDep = 		win.forms.DateDep.getDate();
        current.DateRet = 		win.forms.DateRet.getDate();
        current.Adresse = 		win.forms.Adresse.value;
        current.Adresse2 = 		win.forms.Adresse2.value;
        current.Ville = 		win.forms.Ville.Text();
        current.CP = 			win.forms.CP.Text();
        current.Description = 	win.forms.Description.Value();

        if(!newObj){
            if(!this.checkChange(win)){
                if(!noclose){win.forceClose();}
                return;
            }
        }

        win.ActiveProgress();

        current.commit(function(responseText){

            System.fire('expo:submit.complete', current);

            try{
                if(newObj){

                    win.forceClose();

                    this.open(current);

                    var splite = new SpliteIcon($MUI('Voulez-vous fermer le formulaire') + ' ? ', $MUI('Exposition') +' : ' + current.Title);
                    splite.setIcon('documentinfo-48');

                    if(!noclose){
                        this.win.AlertBox.ti($MUI('Fermer le formulaire') + '...').a(splite).ty().show();
                        this.win.AlertBox.getBtnSubmit().setText($MUI('Fermer')).setIcon('exit');
                        this.win.AlertBox.getBtnReset().setText($MUI('Continuer à modifier le formulaire')).setIcon('file-edit');

                        this.win.AlertBox.submit(function(){
                            this.win.forceClose();
                        }.bind(this));
                    }
                    return;

                }

                //Confirmation d'enregistrement
                var splite = new SpliteIcon($MUI('Le formulaire a été correctement sauvegardé'), $MUI('Exposition') +' : ' + current.Title);
                splite.setIcon('filesave-ok-48');

                win.AlertBox.ti($MUI('Confirmation') + '...').a(splite).ty('NONE').Timer(3).show();
                win.man = current;

                if(!noclose){
                    win.AlertBox.reset(function(){
                        win.forceClose();
                    });
                }
            }catch(er){}
        }.bind(this))

        return true;

    },
    /**
     * System.Exposition.listNotify($N) -> void
     *
     * Cette méthode liste les événements pour les affichers dans le gestionnaire des notifications.
     **/
    listNotify: function($N){
        System.exec('exposition.list', {
            parameters:'options=' + escape(Object.toJSON({op:'-e'})),
            onComplete: function(result){

                try{
                    var obj = result.responseText.evalJSON();
                }catch(er){
                    return;
                }

                if(obj.length > 0){

                    var title = $MUI('Prochaine exposition') + ' : ' + obj[0].Title;

                    var line = $N.addNotify({
                        title: 	title,
                        icon:	'cal',
                        date:	obj[0].DateDep.toDate()
                    });

                    line.date.innerHTML = $MUI('Planifié le') + ' '+ obj[0].DateDep.toDate().format('l d F Y');
                    line.on('click', function(){this.open(obj[0])}.bind(this));

                }
            }.bind(this)
        });
    },
    /**
     * System.Exposition.listNotFinish() -> void
     **/

    listFinish: function(){
        this.searchByFinish();
    },

    searchByFinish: function(box){
        this.listing({op:'-f'});
        this.winList.on('complete',function(){
            this.setTitle($MUI('Listing des expositions terminé')).setIcon('valid');
        });
    },

    listNotFinish: function(){
        this.searchByNotFinish();
    },

    searchByNotFinish: function(box){
        this.listing({op:'-e'});
        this.winList.on('complete',function(){
            this.setTitle($MUI('Listing des expositions à venir')).setIcon('1right');
        });

    },
    /**
     * TaskManager.onChangeFilter(node) -> void
     *
     * Action appellée lors du changement de filtre dans le listing.
     **/
    onChangeFilter: function(node){
        try{

            this.winList.clauses.query = 	'';
            this.winList.clauses.page = 	0;

            switch(node.value){
                default:
                case 0:
                    this.winList.setTitle($MUI('Listing complet des tâches')).setIcon('list');
                    this.listing({});
                    break;
                case 1:
                    this.searchByNotFinish(this.winList.AlertBox);
                    break;
                case 2:
                    this.searchByFinish(this.winList.AlertBox);
                    break;
            }

        }catch(er){System.trace(er)}
    },
    /**
     * System.Exposition.listing([options]) -> void
     *
     * Ouvre la fenêtre du listing des tâches.
     **/
    listing: function(options){

        options = Object.isUndefined(options) ? '' : options;

        if(!(Object.isUndefined(this.winList) || this.winList == null)){
            try{this.winList.close();}catch(er){}
        }

        var sender = this;

        this.winList = 	new WindowList({
            range1:		25,
            range2:		50,
            range3:		100,
            title:		$MUI('Listing complet des expositions'),
            link:		System.link,
            select:		true,
            readOnly:	true,
            icon:		'list',
            empty:		'- ' + $MUI('Aucune exposition d\'enregistrée') + ' -'
        });

        document.body.appendChild(this.winList);

        this.winList.addHeader(new HeaderList({
            Act1:			{title:'', width:80, style:'text-align:center'},
            Exposition_ID:	{title:'N°', width:40, style:'text-align:right'},
            Title:			{title:'Titre'},
            DateDep:		{title:'Début le', width:130},
            DateRet:		{title:'Fin le',  width:130},
            Adresse:		{title:'Adresse', width:230},
            Ville:			{title:'Ville', width:170},
            CP:				{title:'CP', width:60, style:'text-align:center'}
        }));

        this.winList.Select.setData([
            {text:$MUI('Aucun filtre'), value:0},
            {text:$MUI('En cours'), value:1, icon:'1right'},
            {text:$MUI('Terminé'), value:2, icon:'valid'}
        ]);

        this.winList.Select.selectedIndex(0);

        //if(1 * $P.getUserKey('Droits_Inventaire') == 1) {
        this.winList.DropMenu.addMenu($MUI('Ajouter une exposition'), {icon:'add'}).observe('click', function(){this.open()}.bind(this));
        //}
        //filtre
        this.winList.DropMenu.addMenu($MUI('Imprimer'), {icon:'print'}).on('click', function(){
                System.exec('exposition.list.print', {
                    parameters: 'clauses=' + escape(Object.toJSON(this.winList.clauses)) + '&' + this.winList.parameters,
                    onComplete: function(result){
                        var win = System.openPDF(result.responseText);
                        win.setTitle($MUI('Listing des expositions'));
                    }
                });
            }.bind(this)).mouseover(function(){
            sender.winList.Flag.setText('<p class="icon-documentinfo">' + $MUI('Cliquez ici pour imprimer le listing') + '.<p>')
            sender.winList.Flag.setType(FLAG.BOTTOM).color('grey').show(this, true);
        });


        this.winList.addFilters('Act1', function(){
            var args = $A(arguments);

            var box = new SimpleButton({icon:'search-14'});
            box.setClassName('mini-button');
            box.setStyle('margin:0px; margin-right:2px;');
            args[1].setStyle('padding:0px');

            var box2 = new SimpleButton({icon:'cancel-14'});
            box2.setClassName('mini-button');
            box2.setStyle('margin:0px');
            args[1].setStyle('padding:0px');

            box.observe('click', function(evt){
                this.open(args[2]);
            }.bind(this));

            box2.observe('click', function(evt){
                this.remove(new Exposition(args[2]));
            }.bind(this));

            return new Node('div', [box, box2]);
        }.bind(this));

        this.winList.addFilters(['DateDep', 'DateRet'], function(e){
            return '<p>'+e.toDate().format('D. d M. Y')+'</p>';
        })
        //events--------------------------------------------------------------------
        this.winList.observe('close', function(){this.winList = null;}.bind(this));
        this.winList.Select.on('change', function(){
            sender.onChangeFilter(this);
        });


        this.winList.Fullscreen(true);
        this.winList.Hidden(false);
        this.winList.setParameters('cmd=exposition.list&options=' + escape(Object.toJSON(options))).load();
    },
    /**
     * TaskManager.remove(task) -> void
     *
     * Supprime une tâche du listing.
     **/
    remove: function(expo){

        //
        // Splite
        //
        var splite = 			new SpliteIcon($MUI('Voulez-vous vraiment supprimer l\'exposition N°') + ' ' + expo.Exposition_ID + ' ? ', expo.Title);
        splite.setIcon('edittrash-48');
        //
        //
        //
        var box = this.winList.AlertBox;

        box.setTitle($MUI('Suppression de l\'exposition')).a(splite).setIcon('delete').setType().show();


        box.getBtnReset().setIcon('cancel');
        box.getBtnSubmit().setIcon('delete').setText('Supprimer l\'exposition');

        box.submit(function(){

            expo.remove(function(){
                box.hide();

                System.fire('expo:remove', expo);

                //
                // Splite
                //
                var splite = new SpliteIcon($MUI('L\'exposition a bien été supprimé') + '.', $MUI('Exposition N°') + ' ' + expo.Exposition_ID);
                splite.getChildLeft().setStyle('background-position:center');
                splite.setIcon('valid-48');


                box.setTitle($MUI('Confirmation')).setContent(splite).setType('CLOSE').Timer(5).show();
                box.getBtnReset().setIcon('cancel');
                box.setIcon('documentinfo');

            }.bind(this));

        }.bind(this));
    }
};

Extends.observe('dom:loaded', function(){System.Exposition.initialize()});

/** section: Plugins
 * class Exposition
 *
 * Cette classe gère les gestions des Exposition.
 **/
var Exposition = Class.create();
Exposition.prototype = {
    /**
     * Exposition.Exposition_ID -> Number
     **/
    Exposition_ID:			0,
    /**
     * Exposition.DateDep -> Number
     **/
    DateDep:			null,
    /**
     * Exposition.DateRet -> Number
     **/
    DateRet:			null,
    /**
     * Exposition.Title -> String
     **/
    Title:				'',
    /**
     * Exposition.Adresse -> String
     **/
    Adresse:			null,
    /**
     * Exposition.Adresse2 -> String
     **/
    Adresse2:			null,
    /**
     * Exposition.Ville -> String
     **/
    Ville:			'',
    /**
     * Exposition.CP -> String
     **/
    CP:				'',
    /**
     * Exposition.Description -> String
     **/
    Description:	'',
    /**
     * new Exposition([obj])
     *
     * Cette méthode créée une nouvelle instance d'une tâche.
     **/
    initialize: function(obj){

        this.User_ID = $U().User_ID;

        if(!Object.isUndefined(obj)){
            this.setObject(obj);
        }
        if(this.DateDep == null){
            this.DateDep = new Date();
        }
        if(this.DateRet == null){
            this.DateRet = new Date();
        }

    },
    /**
     *
     */
    clone: function(){
        var expo = new Exposition();

        expo.Exposition_ID =	this.Exposition_ID;
        expo.Title =			this.Title;
        expo.DateDep =			this.DateDep.clone();
        expo.DateRet =			this.DateRet.clone(),
            expo.Adresse =			this.Adresse;
        expo.Adresse2 =			this.Adresse2;
        expo.Ville = 			this.Ville;
        expo.CP =				this.CP;
        expo.Description =		this.Description;

        return expo;
    },
    /**
     *
     */
    commit: function(callback){

        System.exec('exposition.commit', {

            parameters: "Exposition=" + escape(Object.toJSON(this)),
            onComplete: function(result){
                this.evalJSON(result.responseText);

                if(Object.isFunction(callback)) callback.call(this, this);
            }.bind(this)

        });

    },
    /**
     * Supprime l'événement en base de données
     */
    remove: function(callback){
        System.exec('exposition.delete',{
            parameters: 'Exposition=' + escape(Object.toJSON(this)),
            onComplete: function(result){

                try{
                    var obj = result.responseText.evalJSON();
                }catch(er){return;}

                if(Object.isFunction(callback)) callback.call('');
            }.bind(this)
        });
    },
    /**
     *
     */
    evalJSON: function(json){
        this.setObject(json.evalJSON());
    },
    /**
     *
     */
    toJSON: function(){
        var obj = {};

        obj.Exposition_ID =		this.Exposition_ID;
        obj.Title =				encodeURI(this.Title);
        obj.DateDep =			this.DateDep.toString_('datetime', 'eng');
        obj.DateRet =			this.DateRet.toString_('datetime', 'eng'),
            obj.Adresse =			encodeURI(this.Adresse);
        obj.Adresse2 =			encodeURI(this.Adresse2);
        obj.Ville = 			encodeURI(this.Ville);
        obj.CP =				encodeURI(this.CP);
        obj.Description =		encodeURI(this.Description);

        return Object.toJSON(obj);
    },
    /**
     *
     */
    setObject: function(obj){
        for(var key in obj){
            this[key] = obj[key];
        }

        if(Object.isString(this.DateDep)){
            this.DateDep = this.DateDep.toDate();
        }
        if(Object.isString(this.DateRet)){
            this.DateRet = this.DateRet.toDate();
        }
        return this;
    }
};