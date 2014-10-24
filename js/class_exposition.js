/** section: ExpositionManager
 * class ExpositionManager
 * Cette classe gère les interfaces des expositions.
 **/
var ExpositionManager = Class.create();

ExpositionManager.prototype = {
	VERSION:	0.1,
/**
 * new ExpositionManager() -> void
 *
 * Cette méthode créée une nouvelle instance du gestionnaire des tâches.
 **/
	initialize: function(){
		
		this.ExpensesManager = new ExpensesManager();
		
		$S.observe('expo:submit.complete', function(task){
			this.onChangeDate();

			if(!Object.isUndefined(this.winList)){
				this.winList.load();	
			}
			$NM().load();
		}.bind(this));
			
		$S.observe('expo:remove.complete', function(task){
			this.onChangeDate();
			
			if(!Object.isUndefined(this.winList)){
				this.winList.load();
			}
			$NM().load();
		}.bind(this));
		
		$S.observe('system:startinterface', this.startInterface.bind(this));
		
		$S.observe('system:external.open', function(win, obj){
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
		
		$S.observe('expense:submit.complete', function(){
			if(Object.isFunction(this.win.loadNote)) this.win.loadNote();
		}.bind(this));
		
		$S.observe('notify:draw', this.listNotify.bind(this));
	},
/**
 * ExpositionsManager.startInterface() -> void
 *
 * Cette méthode liste les procédures à effectuer lors du lancement de l'interface d'administration.
 **/
	startInterface:function(){
		$S.DropMenu.addMenu($MUI('Expositions'), {icon:'cal'}).on('click', function(){this.listNotFinish()}.bind(this));
		$S.DropMenu.addLine($MUI('Expositions'), $MUI('Ajouter'), {icon:'add', border:true, bold:true}).on('click', function(){this.open()}.bind(this));	
		$S.DropMenu.addLine($MUI('Expositions'), $MUI('Listing des prochaines expositions'), {icon:'1right'}).on('click', function(){this.listNotFinish()}.bind(this));
		$S.DropMenu.addLine($MUI('Expositions'), $MUI('Listing des expositons terminées'), {icon:'valid', border:true}).on('click', function(){this.listFinish()}.bind(this));
		$S.DropMenu.addLine($MUI('Expositions'), $MUI('Listing complet'), {icon:'list'}).on('click', function(){this.listing()}.bind(this));
		
		this.startWidgetInterface();
	},
/**
 * EvenementsManager.startWidgetInterface() -> void
 *
 * Cette méthode initialise le `Widget` qui sera ajouté au bureau de l'administration.
 **/	
	startWidgetInterface: function(){
		//lancement de l'interface spécialisé C2E
		//
		// ScrollTable
		//
		var scrolltable = 		new ScrollTable();
		scrolltable.setStyle('height:270px;');
		//
		// Flag
		//
		var flag = new Flag();
		//
		// Widget
		//
		var widget = 	this.widget =	new Widget();
		widget.setTitle($MUI('Explorateur des expositions'));
		widget.setIcon('cal');
		widget.appendChild(scrolltable);
		widget.appendChild(flag);
		//
		// Calendar
		//
		widget.Calendar = 		new Calendar();
		widget.Calendar.setStyle('margin:auto; text-align:center');
		widget.header.appendChild(new Node('div', {style:'text-align:center; padding:5px;'}, widget.Calendar));
		
		widget.Calendar.observe('draw', this.onDraw.bind(this));
		widget.Calendar.observe('next', this.onChangeDate.bind(this));
		widget.Calendar.observe('prev', this.onChangeDate.bind(this));
		widget.Calendar.observe('nexttwo', this.onChangeDate.bind(this)); 
		widget.Calendar.observe('prevtwo', this.onChangeDate.bind(this));
		
		//
		// Simple
		//
		widget.SimpleTable = 	new SimpleTable({
			range1:		25, 
			range2:		50, 
			range3:		100,
			link:		$S.link,
			readOnly:	true
		});
		
		widget.SimpleTable.DivEmpty = 		new Node('div', {style:'width:100%; text-align:center; background-color:#D4D4D4; color:#464646; text-shadow:0px 1px #FFF;padding: 5px 0px 5px 0px;'}, '- ' + $MUI('Aucune exposition pour ce mois-ci') +' -');
	
				
		widget.SimpleTable.addHeader({ 
			Action:			{title:'', width:50, style:'text-align:center', type:'action'},
			Exposition_ID:	{title:'N°', width:40, style:'text-align:right'},
			Title:			{title:'Titre'},
			DateDep:		{title:'Début le', width:80,style:'text-align:center'},
			DateRet:		{title:'Fin le',  width:80,style:'text-align:center'}
		});
		
		widget.SimpleTable.addFilters(['DateDep', 'DateRet'], function(e){
			return '<p>'+e.toDate().toString_('datetime', MUI.lang)+'</p>';
		});
				
		widget.SimpleTable.observe('open', function(evt, data){
			this.open(data);
		}.bind(this));
		
		widget.SimpleTable.observe('remove', function(evt, data){
			this.remove(new Exposition(data));
		}.bind(this));
		widget.SimpleTable.observe('close', function(){this.winList = null;}.bind(this));

		var dateDep = this.widget.Calendar.getDate().clone();
		dateDep.setDate(1);
		
		var dateRet = this.widget.Calendar.getDate().clone();
		dateRet.setDate(dateRet.daysInMonth());

		widget.SimpleTable.setParameters('cmd=exposition.list&options=' + escape(Object.toJSON({
			Debut:	dateDep.toString_('date') + ' 00:00:00',
			Fin:	dateRet.toString_('date') + ' 00:00:00',
			op:		'-d'
		})));
		
		scrolltable.appendChild(widget.SimpleTable);
		scrolltable.appendChild(widget.SimpleTable.DivEmpty);
		
		$S.WidgetContainer.appendChild(widget);
		
		this.onChangeDate();
	},
/**
 * EvenementsManager.onDraw() -> void
 *
 * Cette méthode est appelée lors de la construction du calendrier.
 **/
	onDraw: function(node){

		var sender = this;
		
		for(var i = 0; i < this.widget.Calendar.options.length; i++){
			
			try{				
				var current = this.widget.Calendar.options[i];
				
				if(current.DateDep.toDate().toString_('date') <= node.Date.toString_('date') 
					&& node.Date.toString_('date') <= current.DateRet.toDate().toString_('date')){
						
					if(node.Date.toString_('date') == current.DateDep.toDate().toString_('date')){
						node.addTag('left');	
					}else if(node.Date.toString_('date') == current.DateRet.toDate().toString_('date')){
						node.addTag('right');	
					}else{
						node.addTag('middle');	
					}
					
					node.data = current;
					
					node.on('mouseover', function(){
						
						var str = 	'<p class="icon-date">' + this.Date.format('d F Y') + '</p>';
						str += 		'<p class="icon-documentinfo"><span style="width:60px; display:inline-block">' + $MUI('Objet') + ' :</span> ' + this.data.Title +'</p>'; 
						str += 		'<p><span style="width:60px; display:inline-block">' + $MUI('Début') + ' :</span> ' + this.data.DateDep.toDate().format('d F Y ' + $MUI('à') + ' h:i')  +'</p>'; 
						str += 		'<p><span style="width:60px; display:inline-block">' + $MUI('Fin') + ' :</span> ' + this.data.DateRet.toDate().format('d F Y ' + $MUI('à') + ' h:i')  +'</p>';						
						sender.widget.Calendar.Flag.setText(str).color('grey').show(this, true);
					});
					
					node.observe('mouseup', function(evt){
						sender.widget.Calendar.Flag.hide();
						sender.open(this.data);
					});
					continue;
				}
			}catch(er){$S.trace(er)}
		}
		
	
	},
/**
 * EvenementsManager.onChangeData() -> void
 *
 * Cette méthode est appelée lorsque l'utilisateur change la date du calendrier.
 **/
	onChangeDate: function(){
		this.widget.Calendar.options = [];
		
		var dateDep = this.widget.Calendar.getDate().clone();
		dateDep.setDate(1);
		
		var dateRet = this.widget.Calendar.getDate().clone();
		dateRet.setDate(dateRet.daysInMonth());
				
		$S.exec('exposition.list', {
			parameters: 'options=' + escape(Object.toJSON({
				Debut:	dateDep.toString_('date')+ ' 00:00:00',
				Fin:	dateRet.toString_('date')+ ' 00:00:00',
				op:			'-d'
			})),
			
			onComplete: function(result){
				
				try{
					var obj = result.responseText.evalJSON();
				}catch(er){
					return;	
				}
				
				this.widget.SimpleTable.clear();
				
				if(obj.length == 0){
					this.widget.SimpleTable.DivEmpty.show();
				}else{
					this.widget.SimpleTable.DivEmpty.hide();
					try{
						this.widget.Calendar.options = obj;
						this.widget.Calendar.draw();					
						this.widget.SimpleTable.addRows(obj);
					}catch(er){$S.trace(er)}
				}
			}.bind(this)
		});
	},
/**
 * ExpositionManager.open(task) -> void
 *
 * Ouvre un nouveau formulaire des tâches.
 **/
	open: function(expo){
		try{
			
			
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
			
			win.expo = 			new Exposition(expo);
			//
			//forms
			//
			var forms =		{};
			//
			// Window
			//
			win.Resizable(false);
			win.createFlag().setType(FLAG.TYPE);
			win.createBox();
			win.setTitle($MUI('Gestion d\'une exposition')).setIcon('cal');	
			win.createHandler($MUI('Chargement en cours'), true);
			
			win.forms = 	forms;
			this.win = 		win;
			
			$Body.appendChild(win);
			//
			// DropMenu
			//
			//win.DropMenu.setType(DROP.RUBBON);
						
			forms.submit = 		new SimpleButton({text:$MUI('Enregistrer'), icon:'filesave'}).on('click', function(){this.submit(win)}.bind(this));
			forms.print = 		new SimpleMenu({text:'', icon:'print'});
			forms.addNote = 	new SimpleMenu({text:'', icon:'add'});
			forms.close = 		new SimpleButton({text:$MUI('Fermer'), icon:'exit'}).on('click', function(){win.close();}.bind(this));
			
			//
			//TabControl
			//
			forms.TabControl = win.createTabControl();
						
			forms.TabControl.addPanel($MUI('Informations'), this.createPanel(win)).setIcon('cal');
			forms.TabControl.addPanel($MUI('Description'), this.createPanelDescription(win)).setIcon('file-edit');
			forms.Note = forms.TabControl.addPanel($MUI('Note de frais'), this.createPanelNote(win)).setIcon('knotes');
			forms.TabControl.addSimpleMenu(forms.print);
			forms.TabControl.addSimpleMenu(forms.addNote);
			
			win.appendChild(forms.TabControl);
			
			forms.Description.load();
			
			$S.fire('expo:open', win);
						
			//Ajout de l'aide et incident
			
			new TabControlInteract(win, win.TabControl, {
				incident:		'Exposition Manager - Gestion d\'une exposition',
				
				options: {
					name:		'ExpositionManager', 
					version:	ExpositionManager.prototype.VERSION	
				}
			});
			
			forms.print.on('click', function(){
				$S.exec('exposition.print', {
					parameters: 'Exposition_ID=' + expo.Exposition_ID,
					onComplete: function(result){
						var win = $S.openPDF(result.responseText);
						win.setTitle($MUI('Fiche d\'exposition'));							
					}
				});
			});
			
			forms.print.on('mouseover', function(){
				win.Flag.setText('<p class="icon-documentinfo">' + $MUI('Imprimer la fiche')  + '</p>').setType(FLAG.BOTTOM).color('grey').show(this, true);
			});
			
			forms.addNote.on('click', function(){
				this.ExpensesManager.open({Exposition_ID:win.expo.Exposition_ID}, win);
			}.bind(this));
			
			forms.addNote.on('mouseover', function(){
				win.Flag.setText('<p class="icon-documentinfo">' + $MUI('Ajouter une note de frais')  + '</p>').setType(FLAG.BOTTOM).color('grey').show(this, true);
			});
			
		}catch(er){$S.trace(er)}
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
		var Panel = 	new Node('div', {className:"system-panel my-date-panel", style:'min-height:300px'});
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
		var widget1 = 	new Widget();
		widget1.setTitle($MUI('Informations'));
		widget1.setIcon('date');
		widget1.Table = new TableData();
		widget1.Table.setStyle('width:100%');
		widget1.appendChild(widget1.Table);
		
		widget1.Table.addHead($MUI('Titre') + ' : ', {width:130}).addField(win.forms.Title).addRow();
		widget1.Table.addHead($MUI('Date de début') + ' : ').addField(win.forms.DateDep).addRow();
		widget1.Table.addHead($MUI('Date de fin') + ' : ').addField(win.forms.DateRet);
		//
		//
		//
		var widget2 = 	new Widget();
		widget2.setTitle($MUI('Lieu'));
		widget2.setIcon('map');
		widget2.Table = new TableData();
		widget2.Table.setStyle('width:100%');
		widget2.appendChild(widget2.Table);
		
		widget2.Table.addHead($MUI('Adresse') + ' : ', {width:130}).addField(win.forms.Adresse).addRow();
		widget2.Table.addHead(' ').addField(win.forms.Adresse2).addRow();	
		widget2.Table.addHead($MUI('Code Postal') + ' : ').addField(win.forms.CP).addRow();
		widget2.Table.addHead($MUI('Ville') + ' : ').addField(win.forms.Ville);
		//
		// Widget
		//
		var widget3 = 	new Widget();
		widget3.setTitle($MUI('Note de frais'));
		widget3.setStyle('margin-bottom:10px');
		widget3.setIcon('knotes');
		widget3.Table = new TableData();
		widget3.Table.setStyle('width:100%');
		widget3.appendChild(widget3.Table);
		
		widget3.Table.addHead($MUI('Total HT') + ' : ',{width:130}).addCel(win.forms.MontantHT).addRow();
		widget3.Table.addHead($MUI('Total TTC') + ' : ').addCel(win.forms.MontantTTC);
		
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
					
		Panel.appendChild(splite);
		Panel.appendChild(widget1);
		Panel.appendChild(widget2);
		Panel.appendChild(widget3);
		
		Panel.appendChild(win.forms.submit);
		Panel.appendChild(win.forms.close);
		
		return Panel;
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
		var Panel = 	new Node('div', {className:"system-panel my-file-panel", style:'min-height:300px;padding:5px'});
		//
		// Description
		// 
		win.forms.Description =		new Editor({width:'100%', height:'400px', media:$FM().createHandler()});
		win.forms.Description.Value(win.expo.Description);
		
		Panel.appendChild(win.forms.Description);
		
		return Panel;
	},
/**
 * Exposition.createPanelNote
 **/
 	createPanelNote:function(win){
		//#pragma region Instance
		//
		// Panel
		//
		var Panel = 	new Node('div', {className:"system-panel my-file", style:'min-height:300px;'});
		//
		// Splite
		//
		var splite = 	new SpliteIcon($MUI('Liste des notes de frais'), $MUI('Cliquez sur l\'une des lignes du tableau pour éditer une note de frais') + ' :');
		splite.setIcon('knotes-48');
		//
		//SimpleTable
		//
		var st = new SimpleTable({
			link: 		$S.link,
			parameters: 'op=expense.list&options=' + escape(Object.toJSON({op:'-e', value:win.expo.Exposition_ID})),
			readOnly:	true
		});
		
		st.addHeader({
			Action: 	{title:' ', type:'action', width:40},
			Frais_ID:	{title:'N°', width:40, style:'text-align:right'},
			Description:{title:'Description'},
			Date:		{title:'Date', width:'150'},
			Montant_HT:	{title:'Montant HT', width:'100', style:'text-align:center'},
			Montant_TTC:{title:'Montant TTC', width:'100', style:'text-align:center'}
		});
				
		//#pragma endregion Instance
		
		st.on('open', function(evt, data){
			this.ExpensesManager.open(data, win);
		}.bind(this));
		
		st.on('remove', function(evt, data){
			this.ExpensesManager.remove(win, new Expense(data));
		}.bind(this));
				
		st.addFilters('Date', function(e){
			try{
				return e.toDate().format('d M Y');
			}catch(er){
				return e;	
			}
		});
		
		win.expo.Montant_T_HT = 0;
		win.expo.Montant_T_TTC = 0;
		
		st.addFilters('Montant_HT', function(e, cel){
			cel.setStyle('text-align:right;');
			win.expo.Montant_T_HT += (1 * e);
			
			win.forms.MontantHT.innerHTML = 	win.expo.Montant_T_HT.format(2, ",", " ") + ' €';
		
			return 	'<p>' + (1 * e).format(2, ",", " ") + ' €' + '</p>';
		}.bind(this));
		
		st.addFilters('Montant_TTC', function(e, cel){
			cel.setStyle('text-align:right;');
			win.expo.Montant_T_TTC += (1 * e);
			
			win.forms.MontantTTC.innerHTML = win.expo.Montant_T_TTC.format(2, ",", " ") + ' €';
			
			return '<p>' + 	(1 * e).format(2, ",", " ") + ' €' + '</p>';
		}.bind(this));
				
		win.getClausesNote = function(){
			return st.clauses;
		}.bind(st);
		
		win.loadNote = function(){
			win.ActiveProgress();
			this.load();
		}.bind(st);
		
		st.on('complete', function(obj){
			win.forms.Note.setText($MUI('Notes de frais') + ' (' + obj.length  +')');
		});
		
		//
		//
		//
		var scrolltable = new ScrollTable(st);
		scrolltable.setStyle('min-height:300px');
		scrolltable.addClassName('scrollpanel');
		
		Panel.appendChild(splite);
		Panel.appendChild(scrolltable);
		
		if(win.expo.Exposition_ID != 0) {
			win.ActiveProgress();
			st.load();	
		}
		
		return Panel;
	},
/**
 * ExpositionManager.checkChange(win) -> Boolean
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
							$S.trace(key);
							return true;
						}					
					}
					return false;
					
				})(last, current);
	},
/**
 * ExpositionManager.submit(win) -> void
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
		$S.fire('expo:open.submit', evt);
		
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
			
			$S.fire('expo:submit.complete', current);
						
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
 * ExpositionManager.listNotify($N) -> void
 *
 * Cette méthode liste les événements pour les affichers dans le gestionnaire des notifications.
 **/	
	listNotify: function($N){
		$S.exec('exposition.list', {
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
 * ExpositionManager.listNotFinish() -> void
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
		
		}catch(er){$S.trace(er)}
	},		
/**
 * ExpositionManager.listing([options]) -> void
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
			link:		$S.link,
			select:		true,
			readOnly:	true,
			icon:		'list',
			empty:		'- ' + $MUI('Aucune exposition d\'enregistrée') + ' -'
		});
		
		$Body.appendChild(this.winList);
		
		this.winList.addHeader(new HeaderList({ 
			Act1:			{title:'', width:50, style:'text-align:center'},
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
			$S.exec('exposition.list.print', {
				parameters: 'clauses=' + escape(Object.toJSON(this.winList.clauses)) + '&' + this.winList.parameters,
				onComplete: function(result){
					var win = $S.openPDF(result.responseText);
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
					
				$S.fire('expo:remove', expo);
				
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

Extends.observe('dom:loaded', function(){new ExpositionManager()});

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

		$S.exec('exposition.commit', {
			
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
		$S.exec('exposition.delete',{
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