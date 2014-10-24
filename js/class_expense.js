/**
 * Gestion des notes de frais.
 * @file expense.js
 * @date 02/09/2010
 * @author lenzotti romain
 * @version 0.1
 * @note Analemme Planning Master licence
 *	This work is licensed under a Creative Commons Attribution 2.5 Generic License, http://creativecommons.org/licenses/by/2.5/
 */
var ExpensesManager = Class.create();

ExpensesManager.prototype = {
	initialize: function(){},
/**
 * ExpensesManager.open(expense [, options]);
 **/
	open: function(expense, win){
			
		if(!(Object.isUndefined(this.win) || this.win == null)){
			try{
				this.win.close();	
			}catch(er){}
			
			this.win = null;
		}
			
		if(Object.isUndefined(expense) || expense == null){
			expense = new Expense();
		}else{
			expense = new Expense(expense);
		}
		
		var forms = {};
		//
		// Splite
		//
		var splite =	new SpliteIcon($MUI('Gestion d\'une note de frais'), $MUI('Saisissez les informations demandées par le formulaire') + ' :');		
		splite.setIcon('knotes-48');
		//
		//Description
		//
		forms.Description =			new Node('input', {type:'text', style:'width:200px', value:expense.Description});
		//
		//Date
		//
		forms.Date =				new InputCalendar();
		forms.Date.setDate(expense.Date);
		//
		//Montant_HT
		//
		forms.Montant_HT =			new Node('input', {type:'text', style:'width:80px; text-align:right', value:(1 * expense.Montant_HT).format(2, '.', '')});
		//
		//Montant_TTC
		//
		forms.Montant_TTC =			new Node('input', {type:'text', style:'width:80px; text-align:right', value:(1 * expense.Montant_TTC).format(2, '.', '')});
		//
		//Table
		//
		var table = 	new TableData();
		table.setClassName('block-form');
		table.setStyle('margin:10px');
				
		table.addHead($MUI('Description') + ' : ', {width:150}).addField(forms.Description).addRow();
		table.addHead($MUI('Date') + ' : ', {width:150}).addField(forms.Date).addRow();
		table.addHead($MUI('Montant HT') + ' : ', {width:150}).addField(new Node('span', [forms.Montant_HT, ' € ' +$MUI('HT')])).addRow();
		table.addHead($MUI('Montant TTC') + ' : ').addField(new Node('span', [forms.Montant_TTC, ' € ' +$MUI('TTC')])).addRow();

		//#pragma endregion Instance
		//
		// Box
		//
		var box = 	win.createBox();
		box.forms = forms;
		var flag = 	box.box.createFlag().setType(FLAG.RIGHT);
		box.expense = expense;
		
		box.setIcon('file-edit-2').setTitle($MUI('Gestion d\'une note de frais'));
		box.setType().as([splite, table]);
		box.getBtnSubmit().setText($MUI('Enregistrer')).setIcon('filesave');
		box.getBtnReset().setText($MUI('Annuler')).setIcon('cancel');
		box.show();
		
		forms.Description.select();
		flag.setText('<p class="icon-documentinfo">' + $MUI('Saisissez ici la <b>description</b> de la note de frais')+ '.</p>').color('grey').show(forms.Description);
				
		//#pragma region Event
		
		var options = 	box.getElementsByTagName('input');
		
		for(var i = 0; i < options.length; i++){
			options[i].observe('blur', function(){win.Flag.hide();});
		}
		
		var sender = this;
		
		forms.Description.observe('focus', function(){
			win.Flag.setText('<p class="icon-documentinfo">' + $MUI('Saisissez ici la <b>description</b> de la note de frais')+ '.</p>').color('grey').show(this);
		});
		
		forms.Montant_HT.observe('focus', function(){
			win.Flag.setText('<p class="icon-documentinfo">' + $MUI('Saisissez ici le <b>montant HT</b> de la note de frais') + '.</p>').color('grey').show(this);
		});
		
		forms.Montant_TTC.observe('focus', function(){
			win.Flag.setText('<p class="icon-documentinfo">' + $MUI('Saisissez ici le <b>montant TTC</b> de la note de frais')+ '.</p>').color('grey').show(this);
		});
		
		//vérification des blurs
		forms.Description.keyupenter(function(evt){
			if(this.value == ''){
				flag.setText($MUI('Saisissez ici la <b>description</b> de la note de frais')).color('red').show(this);
			}else{
				forms.Montant_HT.select();
			}
		});
		
		forms.Montant_HT.keyupenter(function(evt){
			Event.stop(evt);

			if(this.value == ''){
				this.value = '0.00';	
			}
			else{
				var money = 1 * this.value.replaceAll(',', '.');

				if(isNaN(money)){
					flag.setText($MUI('Seuls les <b>chiffres</b> et le point <b>.</b> sont acceptés dans cette zone') +' !').color('red').show(this);
					return;		
				}
				
				this.value = money.format(2, '.', '');
			}
			
			forms.Montant_TTC.select();

		});
		
		forms.Montant_TTC.keyupenter(function(){

			if(this.value == ''){
				this.value = '0.00';	
			}
			else{
				var money = 1 * this.value.replaceAll(',', '.');

				if(isNaN(money)){
					flag.setText($MUI('Seuls les <b>chiffres</b> et le point <b>.</b> sont acceptés dans cette zone') +' !').color('red').show(this);
					return;		
				}
				
				this.value = money.format(2, '.', '');
			}
			
			forms.submit.fire('click');
			
		});
		
		//#pragma endregion Event
		
		box.submit(function(){
		
			flag.hide();
		
			try{
				if(forms.Description.value == ''){
					flag.setText($MUI('Saisissez une <b>description</b> de la note de frais')).show(forms.Description);
					return true;	
				}
				
				if(forms.Montant_HT.value == ''){
					flag.setText($MUI('Saisissez le <b>montant HT</b> de la note de frais')).show(forms.Montant_HT);
					return true;	
				}
				
				if(forms.Montant_HT.value == '0.00' && win.forms.Montant_TTC.value == '0.00'){
					flag.setText($MUI('Saisissez le <b>montant HT</b> de la note de frais')).show(forms.Montant_HT);
					return true;	
				}
				
				if(isNaN(1 * forms.Montant_HT.value)){
					flag.setText($MUI('Saisissez un <b>montant HT</b> correct')).show(forms.Montant_HT);
					return true;	
				}
				
				if(isNaN(1 * forms.Montant_TTC.value)){
					flag.setText($MUI('Saisissez un <b>montant TTC</b> correct')).show(forms.Montant_TTC);
					return true;	
				}
				
				expense.Description = 	forms.Description.value;
				expense.Date = 			forms.Date.getDate();
				expense.Montant_HT = 	forms.Montant_HT.value;
				expense.Montant_TTC = 	forms.Montant_TTC.value;
				
				var evt = {stop:function(){this.stopped = true}, stopped:false};
				
				$S.fire('expense:open.submit', evt, win);
				
				if(evt.stopped) return;
	
				box.wait();
		
				expense.commit(function(){
					try{
						win.AlertBox.hide();
						
						var splite = new SpliteIcon($MUI('Les informations ont bien été enregistré')+'.',  expense.Description);
						splite.setIcon('filesave-ok-48');
						
						box.ti($MUI('Confirmation') + '...').ty('NONE').a(splite).setIcon('knotes').Timer(4).show();
											
						$S.fire('expense:submit.complete', win.expense);
						
					}catch(er){
						$S.trace(er)
					}
				}.bind(this));
			}catch(er){$S.trace(er)}
			
			return true;
			
		}.bind(this));
	},
/**
 * ExpensesManager.remove(win, expense);
 **/
	remove: function(win, expense){
				
		expense = new Expense(expense);
		
		var box = win.AlertBox;
		//---------------------
		//Splite---------------
		//---------------------
		var splite = new SpliteIcon($MUI('Voulez-vous vraiment supprimer la note de frais N°') + ' ' + expense.Frais_ID +' ?', expense.Description);
		splite.setIcon('trash-48');
		

		box.ti($MUI('Suppression de la note de frais')).a(splite).ty().show();
		box.getBtnSubmit().setIcon('delete').setText('Supprimer');
		box.getBtnReset().setIcon('cancel');
		
		$S.fire('expense:remove.open', box);
		
		box.submit(function(){
			
			var evt = new StopEvent(box);
			$S.fire('expense:remove.submit', evt);
			
			if(evt.stopped)	return true;
			
			expense.remove(function(){
				
				box.hide();
				
				$S.fire('expense:remove.complete', evt);
			});
			
			return true;
		});
		
		
		
	}
};

var Expense = Class.create();
Expense.prototype = {
	/**
	 * @type Number
	 */
	Frais_ID:			0,
	/**
	 * @type Number
	 */
	Exposition_ID:		0,
	/**
	 * @type Date
	 */
	Date:				null,
	/**
	 * @type String
	 */
	Description:		'',
	/**
	 * @type String
	 */
	Montant_HT:			0,
	/**
	 * @type String
	 */
	Montant_TTC:		0,
	/**
	 * Descriptions
	 * @class Description classe
	 * @constructs
	 */
	initialize: function(obj){
		if(!Object.isUndefined(obj)){
			this.setObject(obj);
		}
		if(this.Date == null){
			this.Date = new Date();	
		}		
	},
	/**
	 *
	 */
	clone: function(){
		var obj = new Expense();
		
		obj.Frais_ID = 		this.Frais_ID;
		obj.Exposition_ID =	this.Exposition_ID;
		obj.Description =	this.Description,
		obj.Date =			this.Date.clone();
		obj.Montant_HT =	this.Montant_HT;
		obj.Montant_TTC = 		this.Montant_TTC;
		
		return obj;
	},
	/**
	 *
	 */
	commit: function(callback){
		$S.exec('expense.commit', {
			
			parameters: "Expense=" + escape(Object.toJSON(this)),
			onComplete: function(result){
				
				try{
					this.evalJSON(result.responseText);
				}catch(er){
					$S.trace(result.responseText);
					return;
				}
				
				if(Object.isFunction(callback)) callback.call(this, this);
			}.bind(this)
			
		});	
		
	},
	/**
	 * Supprime l'événement en base de données
	 */
	remove: function(callback){
		$S.exec('expense.delete',{
			parameters: 'Expense=' + escape(Object.toJSON(this)),
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
		var obj = {
			Frais_ID: 			this.Frais_ID,
			Exposition_ID:		this.Exposition_ID,
			Description:		encodeURI(this.Description),
			Date:				this.Date.toString_('datetime','eng'),
			Montant_HT:			encodeURI(this.Montant_HT),
			Montant_TTC:		encodeURI(this.Montant_TTC),
		};
		return Object.toJSON(obj);
	},
	/**
	 *
	 */
	setObject: function(obj){
		for(var key in obj){
			this[key] = obj[key];	
		}
		
		if(Object.isString(this.Date)){
			this.Date = this.Date.toDate();	
		}

		return this;
	}
};