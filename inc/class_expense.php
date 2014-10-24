<?php
/**
 * @brief Package Agenda. Ce fichier permet la gestion des notes de frais.
 * @file class_expense.php
 * @date 01/09/2010
 * @author lenzotti romain
 * @version 0.1
 * @ingroup Agenda
 * @licenses Analemme Planning Master licence
 * This work is licensed under a Creative Commons Attribution 2.5 Generic License, http://creativecommons.org/licenses/by/2.5/
 */
/**
 * @brief Gère un événement.
 * @class Expense
 * @note Cette classe ce réfère à la table Evenements de la base de données.
 * @ingroup Agenda
 * @author Lenzotti Romain
 */
class Expense extends ObjectTools{
	const TABLE_NAME = 			'exposition_frais';
	const PRIMARY_KEY = 		'Frais_ID';
	
	public $Frais_ID =			0;
	public $Exposition_ID =		0;
	public $Date =				'';
	public $Description =		'';
	public $Montant_HT =		'';
	public $Montant_TTC =		'';
	
	/**
	 * @constructor
	 */
	function __construct(){
		global $P;
		
		$numargs = func_num_args();
		$arg_list = func_get_args();

		if($numargs == 1){
				if(is_int($arg_list[0])) {
					$request = 			new Request(DB_NAME);
					$request->select = 	'*';
					$request->from = 	self::TABLE_NAME;
					$request->where =	self::PRIMARY_KEY.' = '.$arg_list[0];
				
					$u = $request->exec('select');
					
					if($u['length'] > 0){
						$this->setArray($u[0]);
					}
				}
				elseif(is_string($arg_list[0])) $this->evalJSON($arg_list[0]);
				elseif(is_object($arg_list[0])) $this->setObject($arg_list[0]);
				elseif(is_array($arg_list[0])) $this->setArray($arg_list[0]);
		}
	}
	
	final public static function active(){
		
		$request = new Request();
		$request->query = "
			CREATE TABLE IF NOT EXISTS `".self::TABLE_NAME."` (
			  `".self::PRIMARY_KEY."` bigint(20) NOT NULL AUTO_INCREMENT,
			  `Exposition_ID` bigint(20) NOT NULL DEFAULT '0',
			  `Date` date NOT NULL,
			  `Description` varchar(255) NOT NULL,
			  `Montant_HT` float NOT NULL DEFAULT '0',
			  `Montant_TTC` float NOT NULL DEFAULT '0',
			  UNIQUE KEY `Frais_ID` (`".self::PRIMARY_KEY."`)
			) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1";
			
		$request->exec('query');	
	}
	/**
	 *
	 */
	final public static function exec($op){
		
		switch($op){
			case 'expense.commit':
				$expense = new Expense($_POST['Expense']);
				
				if(!$expense->commit()){
					return 'expense.commit';	
				}
				
				echo json_encode($expense);
				
				break;
				
			case 'expense.list.print':
				$_POST['clauses']->limits ='';

				$pdf = Expense::printPDF($_POST['clauses'], $_POST["options"]);
				
				if(!$pdf){
					return 'expense.list.print.err';	
				}
				
				//chmod(ABS_PATH.PATH_PUBLIC, 0777);
				
				$link = PATH_PUBLIC.'listing_frais_u'.$_SESSION['User']['User_ID'].'.pdf';
				
				@unlink(ABS_PATH.$link);
				
				$pdf->Output(ABS_PATH.$link, 'F');
				
				//chmod(ABS_PATH.PATH_PUBLIC, 0755);
				
				echo $link;
				break;
				
			case 'expense.list':

				$tab = Expense::GetList($_POST['clauses'], $_POST["options"]);
				if(!$tab){
					return 'expense.list.err';	
				}
				echo json_encode($tab);
				break;
			case "expense.delete":
				
				$Expense = new Expense($_POST['Expense']);
				
				if(!$Expense->delete()){
					return 'expence.delete.err';
				}
				
				echo json_encode($Expense);
				break;	
		}
	}
	/**
	 * Enregistre les données de l'objet en base de données.
	 * @return Boolean, True si l'enregistrement c'est correctement déroulé.
	 */
	final public function commit(){
		global $P;
		
		$request = 			new Request(DB_NAME);
		$request->from = 	self::TABLE_NAME;

		if($this->Frais_ID == 0){
			
			//ajout de l'événement
			
			$request->fields = '(Exposition_ID, Date, Description, Montant_HT, Montant_TTC)';
			$request->values = "(
								'".$this->Exposition_ID."', 
								'".$this->Date."',
								'".addslashes($this->Description)."',
								'".addslashes($this->Montant_HT)."',
								'".addslashes($this->Montant_TTC)."'
								)";
			
			if(!$request->exec('insert')) return false;
			
			$this->Frais_ID = $request->exec('lastinsert');
			return true;
			
		}
		//mise à jours de la location
			
		$request->set = "	Date = '".$this->Date."', 
							Description = '".addslashes($this->Description)."',
							Montant_HT = '".addslashes($this->Montant_HT)."', 
							Montant_TTC =	'".addslashes($this->Montant_TTC)."'";
							
		$request->where = self::PRIMARY_KEY." = ".$this->Frais_ID;
		
		if(!$request->exec('update')) return false;

		return true;
		
	}
	/**
	 * Supprime les données de l'objet en base de données.
	 * @return Boolean, True si la suppression c'est correctement déroulé.
	 */
	public function delete(){
		
		$request = 			new Request(DB_NAME);
		$request->from = 	self::TABLE_NAME;
		$request->where = 	self::PRIMARY_KEY .' = '. $this->Frais_ID;
				
		if($request->exec('delete')){
			return true;	
		}
		
		return false;
	}
	/**
	 *
	 **/
	public static function printPDF($clauses = '', $options = ''){
		
		$User = $_SESSION["User"];
				
		//inclusion de la langue
		//include(ABS_PATH.'mod/camping/old/lang/'.strtoupper(LANG).'/locations_listings.inc.php');
		
		define('EURO',chr(128));
			
		$pdf = new pdfList('L','mm','A4');
		$pdf->name = 'Listing des notes de frais';
		$pdf->AliasNbPages();
		$pdf->AddPage();
		$pdf->SetLeftMargin(5);
		$pdf->SetRightMargin(5);
		$pdf->SetAutoPageBreak(true, 15);
		$pdf->SetDisplayMode('real');
		
		//En-têtes listing
		$pdf->SetFont('Arial','B',8);
		$pdf->Cell(15,5,utf8_decode('N°'),0,0,'C');
		$pdf->Cell(25,5,utf8_decode('Date'),0,0,'C');
		$pdf->Cell(80,5,utf8_decode('Employé'),0,0,'C');
		$pdf->Cell(105,5,utf8_decode('Motif des frais'),0,0,'C');
		$pdf->Cell(30,5,utf8_decode('Montant HT'),0,0,'C');
		$pdf->Cell(30,5,utf8_decode('Montant TTC'),0,1,'C');
		
		//Listing
		$pdf->SetFont('Arial','',8);
		
		$clauses->limits = '';
		$tab = self::GetList($clauses, $options);		
		
		$ttc = 0;
		$ht = 0;
		for($i = 0;$i < $tab['length']; $i++){
			
			switch(@strtoupper($User['Lang'])){
				default:
				case 'FR':
					$DateDep = explode(' ', $tab[$i]['Date']);
					
					list($y, $m, $d) = explode('-', $DateDep[0]);
					
					$tab[$i]['Date'] = "$d/$m/$y";
					break;
			}
							
			$pdf->Cell(15,5, $tab[$i]["Frais_ID"] . " ",1,0,'R');
			$pdf->Cell(25,5, utf8_decode(" " . $tab[$i]["Date"]),1,0,'C');
			$pdf->Cell(80,5, utf8_decode(" " . $tab[$i]["Pseudo"]),1,0,'L');
			$pdf->Cell(105,5, utf8_decode(" " . $tab[$i]["Description"]),1,0,'L');
			$pdf->Cell(30,5, " " . number_format($tab[$i]["Montant_HT"], 2, ',', ' ') . ' ' . EURO,1,0,'R');
			$pdf->Cell(30,5, " " . number_format($tab[$i]["Montant_TTC"], 2, ',', ' ') . ' ' . EURO,1,1,'R');
			
			$ht += $tab[$i]["Montant_HT"];
			$ttc += $tab[$i]["Montant_TTC"];
		}
		
		$pdf->Ln(1);
		$pdf->Cell(120,5, " ",0,0,'L');
		$pdf->Cell(105,5, utf8_decode("Total :"),0,0,'R');
		$pdf->Cell(30, 5, number_format($ht, 2). ' ' . EURO, 1, 0, 'R');
		$pdf->Cell(30, 5, number_format($ttc, 2). ' ' . EURO, 1, 0, 'R');
				
		//Sortie PDF
		return $pdf;
	}	
	/**
	 * Récupère la liste des objects en base de données. Cette liste contient l'ensemble des locations sur
	 * un interval de date données.
	 * @return Un tableau associatifs
	 */
	public static function GetList($clauses = '', $options = ''){
		global $S;	
							
		//purge des locations-----------------------------------------------
		$request = new Request(DB_NAME);
						
		$request->select = 	'A.*, U.User_ID, U.Nom, U.Prenom';
		$request->from = 	Exposition::TABLE_NAME.' B INNER JOIN `'.self::TABLE_NAME.'` AS A ON B.'.Exposition::PRIMARY_KEY.' = A.'.Exposition::PRIMARY_KEY.'
							INNER JOIN '.User::TABLE_NAME.' U ON U.'.User::PRIMARY_KEY.' = B.User_ID';
		$request->order = 	'Date, Frais_ID';
		
		$request->where = 	' U.`User_ID` = '.User::Get()->getID();

		switch(@$options->op){
			case '-d': //filtrage par Date 
				$request->where .= " AND Date Between '".$options->DateDep."' AND '".$options->DateRet."'";
				break;
			case '-e': //filtrage par exposition
				$request->where .=  ' AND A.Exposition_ID = '.$options->value;
				break;
			default:break;
		}
		
		if(isset($clauses) && $clauses != ''){
			if($clauses->where) {
								
				$request->where .= " 	AND (A.Description like '%". addslashes($clauses->where) . "%' 
										OR Date like '%". addslashes($clauses->where) ."%'
										OR Pseudo like  '%". addslashes($clauses->where) ."%'
										OR Montant_HT like '%". addslashes($clauses->where) ."%'
										OR Montant_TTC like '%". addslashes($clauses->where) ."%')";
				
			}
			if($clauses->order) 	$request->order = $clauses->order;
			if($clauses->limits) 	$request->limits = $clauses->limits;
		}
		
		$result = $request->exec('select');

		if($result){
			$result['maxLength'] = Sql::count($request->from, $request->where);
		}		
		//echo $request->query;
		return $result;
	}
}
?>