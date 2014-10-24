<?php
/**
 * class Exposition
 **/
class Exposition extends ObjectTools{
	
	const TABLE_NAME = 		'exposition';
	const PRIMARY_KEY = 	'Exposition_ID';
	
	public $Exposition_ID = 0;
	public $Post_ID =		0;
	public $Title =			'';
	public $DateDep =		'';
	public $DateRet =		'';
	public $Adresse =		'';
	public $Adresse2 = 		'';
	public $Ville =			'';
	public $CP =			'';
	public $Description =	'';
/**
 * new Exposition()
 **/	
	public function __construct(){
		global $S;
		
		$numargs = 	func_num_args();
		$arg_list = func_get_args();
		
		if($numargs == 1){
					
			if(is_int($arg_list[0])) {	
				$request = 			new Request(DB_NAME);
				$request->select = 	'*';
				$request->from = 	self::TABLE_NAME;
				$request->where =	self::PRIMARY_KEY.' = '.$arg_list[0];
					
				$u = $request->exec('select');
				$this->setArray($u[0]);
	
			}
			elseif(is_string($arg_list[0])) $this->evalJSON($arg_list[0]);
			elseif(is_object($arg_list[0])) $this->setObject($arg_list[0]);
			elseif(is_array($arg_list[0])) $this->setArray($arg_list[0]);

		}
	}
/**
 * Exposition.commit() -> Boolean
 **/
	public function commit(){
		global $S;
		
		$request = 			new Request();
		$request->from = 	self::TABLE_NAME;
		
		if($this->Exposition_ID == 0){
			
			//creation du post
			
			
			$request->fields = "(`Post_ID`, `Title`, `DateDep`, `DateRet`, `Adresse`, `Adresse2`, `Ville`, `CP`, `Description`)";
			$request->values = "(
									'".$this->Post_ID."',
									'".mysql_real_escape_string($this->Title)."',
									'".$this->DateDep."',
									'".$this->DateRet."',
									'".mysql_real_escape_string($this->Adresse)."',
									'".mysql_real_escape_string($this->Adresse2)."',
									'".mysql_real_escape_string($this->Ville)."',
									'".mysql_real_escape_string($this->CP)."',
									'".mysql_real_escape_string($this->Description)."')";

			
			if(!$request->exec('insert')) return false;
			
			$this->Exposition_ID = $request->exec('lastinsert');
			$this->setPost();
			
			return true;
		}
		
		$this->setPost();		
		
		$request->where = "`Exposition_ID` = ".$this->Exposition_ID;
		$request->set = "
						`Post_ID` = '".$this->Post_ID."',
						`Title` = '".mysql_real_escape_string($this->Title)."', 
						`DateDep` = '".$this->DateDep."', 
						`DateRet` = '".$this->DateRet."', 
						`Adresse` = '".mysql_real_escape_string($this->Adresse)."',
						`Adresse2` = '".mysql_real_escape_string($this->Adresse2)."', 
						`Ville` = '".mysql_real_escape_string($this->Ville)."', 
						`CP` = '".mysql_real_escape_string($this->CP)."', 
						`Description` = '".mysql_real_escape_string($this->Description)."'";
	
		return $request->exec('update');			
	}
/**
 * Exposition.setPost() -> void
 *
 * Cette méthode créée un post lié à l'annonce.
 **/	
	final public function setPost(){
		$post = 			new Post($this->Post_ID);
						
		if($this->Post_ID == 0){			
			$date = 			explode(' ', $this->DateDep);
			$date =				str_replace('-', '/', $date[0]);
			$post->Title =		$this->Title.' à '.$this->Ville;
			$post->Type = 		'post expo';	
			$post->Content =	'[exposition]'.$this->Exposition_ID.'[/exposition]';
			$post->Category = 	'annonce';
			$post->Name =		'expo/'.$date .'/' . Post::Sanitize($this->Title.' '.$this->Ville) ;
			$post->commit();
		}else{			
			$date = 			explode(' ', $this->DateDep);
			$date =				str_replace('-', '/', $date[0]);
			$post->Title =		$this->Title.' à '.$this->Ville;
			$post->Type = 		'post expo';
			$post->Content =	'[exposition]'.$this->Exposition_ID.'[/exposition]';
			$post->Name =		'expo/'. $date.'/' . Post::Sanitize($this->Title.' '.$this->Ville);
			$post->Template =	'page.php';
			$post->commit();
		}
		
		$this->Post_ID = $post->Post_ID;
		
		$request= 			new Request();
		$request->where = 	"`" . self::PRIMARY_KEY."` = ".$this->Exposition_ID;
		$request->set = 	"`".Post::PRIMARY_KEY."` = '".Sql::EscapeString($this->Post_ID)."'";
		$request->from = 	self::TABLE_NAME;
		
		$request->exec('update');
	}
/**
 * Exposition.active() -> void
 **/
	public static function Active(){
		$request = new Request();
		$request->query = "
			CREATE TABLE IF NOT EXISTS `exposition` (
			  `Exposition_ID` bigint(20) NOT NULL AUTO_INCREMENT,
			  `Post_ID` bigint(20) NOT NULL AUTO_INCREMENT,
			  `Title` varchar(300) NOT NULL,
			  `DateDep` datetime NOT NULL,
			  `DateRet` datetime NOT NULL,
			  `Adresse` varchar(300) NOT NULL,
			  `Adresse2` varchar(300) NOT NULL,
			  `Ville` varchar(200) NOT NULL,
			  `CP` varchar(5) NOT NULL,
			  `Description` text NOT NULL,
			  PRIMARY KEY (`Exposition_ID`)
			) ENGINE=MyISAM DEFAULT CHARSET=utf8 AUTO_INCREMENT=1";
			
		$request->exec('query');
		
		self::Configure();
		
	}
/**
 * Exposition.Configure() -> void
 **/	
	static public function Configure(){
		$request = 			new Request();
		$request->query = 	"ALTER TABLE `".self::TABLE_NAME."` DROP `User_ID`";
		$request->exec('query');
		
		$request->query =	"ALTER TABLE `".self::TABLE_NAME."` ADD `Post_ID` BIGINT( 20 ) NOT NULL DEFAULT '0' AFTER `Exposition_ID`";
		$request->exec('query');
				
		if(class_exists('BlogPress')){
			
			$cat = new PostCategory();
			$cat->Name = 'exposition';
			$cat->commit();
			
			$expos = self::GetList();
			for($i = 0; $i < $expos['length']; $i++){
				
				$expo = 	new Exposition($expos[$i]);
				$post = 	new Post();
				
				$date = 	explode(' ', $expo->DateDep);
				$date =		str_replace('-', '/', $date[0]);
				
				$post->Title =		$expo->Title;
				$post->Type = 		'post expo';	
				$post->Content =	'[exposition]'.$expo->Exposition_ID.'[/exposition]';
				$post->Category = 	'exposition';
				$post->Name =		'expo/'.$date .'/' . Post::Sanitize($post->Title);
				
				if(!$post->exists()){
					$post->commit();
				}
								
				$expo->Post_ID = $post->Post_ID;
				$expo->commit();
			}
		}
	}
/**
 * Exposition.deactive() -> void
 **/	
	public static function Deactive(){
		if(class_exists('BlogPress')){
			$request = 			new Request();
			$request->from = 	Post::TABLE_NAME;
			$request->where = 	"Type = 'expo' || Type='post expo'";
			
			$request->exec('delete');	
		}
	}
/**
 * Exposition.onStartInterface() -> void
 **/	
	static public function onStartInterface(){
		Blog::EnqueueScript('googlemap');
	}
/**
 * Exposition.exec() -> void
 **/	
	public static function exec($op){
		global $S;
		
		switch($op){
			case 'exposition.create.post':
				Post::DeleteClass('post expo');
				
				$clauses->order = 'DateDep ASC';
				$tab = self::GetList($clauses);
				
				for($i = 0; $i < $tab['length']; $i++){
					$e = new self($tab[$i]);
					$e->Post_ID = 0;	
					$e->commit();
				}
				break;
			case 'exposition.commit':
				$expo = new Exposition($_POST['Exposition']);
				if(!$expo->commit()){
					return 'exposition.commit.err';	
				}
				echo json_encode($expo);
				break;
			case 'exposition.delete':
				$expo = new Exposition($_POST['Exposition']);
				
				if(!$expo->delete()){
					return 'exposition.delete.err';	
				}
				
				echo json_encode($expo);
				
				break;
			case 'exposition.list':
				$tab = self::GetList($_POST['clauses'], $_POST['options']);
				if(!$tab){
					return 'exposition.list.err';	
				}
				echo json_encode($tab);
				break;
			
			case 'exposition.print':
				
				$expo = new Exposition((int) $_POST['Exposition_ID']);
				
				$pdf = $expo->printPDF();
				
				if(!$pdf){
					return 'exposition.print.err';	
				}
				
				//chmod(ABS_PATH.PATH_PUBLIC, 0777);
				
				$link = PATH_PRIVATE.User::Get()->getID().'/Mes PDF/exposition.pdf';
				@Stream::MkDir(ABS_PATH.PATH_PRIVATE.User::Get()->getID(), 0755);
				@Stream::MkDir(ABS_PATH.PATH_PRIVATE.User::Get()->getID().'/Mes PDF/', 0755);
				
				@unlink(ABS_PATH.$link);
				
				$pdf->Output(ABS_PATH.$link, 'F');
								
				echo $link;
				break;
		
			case 'exposition.list.print':
				$_POST['clauses']->limits ='';
				
				$pdf = self::printPDFList($_POST['clauses'], $_POST["options"]);
				
				if(!$pdf){
					return 'exposition.list.print.err';	
				}
				
				$link = PATH_PRIVATE.User::Get()->getID().'/Mes PDF/expositions.pdf';
				@Stream::MkDir(ABS_PATH.PATH_PRIVATE.User::Get()->getID(), 0755);
				@Stream::MkDir(ABS_PATH.PATH_PRIVATE.User::Get()->getID().'/Mes PDF/', 0755);
				@unlink(ABS_PATH.$link);
				$pdf->Output(ABS_PATH.$link, 'F');
				
				echo $link;
				break;	
		}
	}
	
	public function delete(){
		$request =			new Request();
		$request->from = 	self::TABLE_NAME;
		$request->where = 	self::PRIMARY_KEY.' = '.$this->Exposition_ID;
		
		return $request->exec('delete');
	}
	
	public function printPDF(){
		
		setlocale(LC_TIME, 'fr_FR');
		define('EURO',chr(128));
			
		$pdf = new pdfHTML('P','mm','A4');
		$pdf->name = 'Fiche de exposition N° '. $this->Exposition_ID;
		$pdf->AliasNbPages();
		$pdf->AddPage();
		$pdf->SetLeftMargin(5);
		$pdf->SetRightMargin(5);
		$pdf->SetAutoPageBreak(true, 15);
		$pdf->SetDisplayMode('real');
		
				
		//récupération du client et du contact
		
		//--------------------------
		//Titre----------------------
		//--------------------------
		$pdf->Ln(7);
		$back_y = $pdf->GetY();
		
		
		$pdf->SetFont('Arial','',8);
		$pdf->Cell(20,5,utf8_decode('Titre :'),0,0,'R');
		$pdf->SetFillColor(220, 220, 220);
		$pdf->SetFont('Arial','B',8);
		$pdf->Cell(78,5,utf8_decode($this->Title),0,0,'L', 1);
		$pdf->Ln(6);
		
		//--------------------------
		//DateDep-------------------
		//--------------------------
		switch(@strtoupper(LANG)){
			default:
			case 'FR':
				$DateDep = explode(' ',$this->DateDep);
				
				list($y, $m, $d) = explode('-', $DateDep[0]);
				list($h, $i, $s) = explode(':', $DateDep[1]);
				$DateDep = strftime ("%A %d %B %Y - %Hh%M", mktime($h,$i,$s,$m,$d,$y));
				
				$DateRet = explode(' ', $this->DateRet);
				
				list($y, $m, $d) = explode('-', $DateRet[0]);
				list($h, $i, $s) = explode(':', $DateRet[1]);
				$DateRet = strftime ("%A %d %B %Y - %Hh%M", mktime($h,$i,$s,$m,$d,$y));
				
				break;
		}
		
		$pdf->SetFont('Arial','',8);
		$pdf->Cell(20,5,utf8_decode('Début le :'),0,0,'R');
		$pdf->SetFillColor(220, 220, 220);
		$pdf->SetFont('Arial','B',8);
		$pdf->Cell(78,5,utf8_decode($DateDep),0,0,'L', 1);
		$pdf->Ln(6);
		
		//--------------------------
		//DateRet--------------------
		//--------------------------
		
		$pdf->SetFont('Arial','',8);
		$pdf->Cell(20,5,utf8_decode('Fin le :'),0,0,'R');
		$pdf->SetFillColor(220, 220, 220);
		$pdf->SetFont('Arial','B',8);
		$pdf->Cell(78,5, utf8_decode($DateRet),0,0,'L', 1);
				
		$back_y2 = $pdf->GetY();
		//
		
		
		//--------------------------
		//Adresse--------------------
		//--------------------------
		$pdf->SetXY(105, $back_y);
		
		$pdf->SetFont('Arial','',8);
		$pdf->Cell(20, 5, utf8_decode('Adresse :'),0,0,'R');
		$pdf->SetFillColor(220, 220, 220);
		$pdf->SetFont('Arial','B',8);
		$pdf->Cell(79, 5, utf8_decode($this->Adresse),0,0,'L', 1);
		$pdf->Ln(6);
		
		$pdf->SetX(105);
		$pdf->SetFont('Arial','',8);
		$pdf->Cell(20, 5, utf8_decode(' '),0,0,'R');
		$pdf->SetFillColor(220, 220, 220);
		$pdf->SetFont('Arial','B',8);
		$pdf->Cell(79, 5, utf8_decode($this->Adresse2),0,0,'L', 1);
		$pdf->Ln(6);
		
		$pdf->SetX(105);
		$pdf->SetFont('Arial','',8);
		$pdf->Cell(20,5, utf8_decode('Cp / Ville :'),0,0,'R');
		$pdf->SetFillColor(220, 220, 220);
		$pdf->SetFont('Arial','B',8);
		$pdf->Cell(79,5,utf8_decode($this->CP.' '.$this->Ville),0,0,'L', 1);
		$pdf->Ln(6);	
		
		$back_y3 = $pdf->GetY();
		
		$back_y2 = $back_y2 < $back_y3 ? $back_y3 : $back_y2;
		
		$pdf->Rect(5, 51, 99, $back_y2 - $back_y+1);
		$pdf->Rect(106, 51, 99, $back_y2 - $back_y+1);
		
		$pdf->SetXY(5, $back_y2);
		$pdf->Ln(4);
		
		//En-têtes listing
		$pdf->SetFont('Arial','B',9);
		$pdf->Cell(0,5,utf8_decode('Note de frais :'), 'B',0,'L');
		
		$pdf->Ln(7);
		
		$pdf->SetFont('Arial','B',8);
		$pdf->Cell(20,5,utf8_decode('N°'),0,0,'C');
		$pdf->Cell(100,5,utf8_decode('Titre'),0,0,'C');
		$pdf->Cell(20,5,utf8_decode('Date'),0,0,'C');
		$pdf->Cell(30,5,utf8_decode('Montant HT'),0,0,'C');
		$pdf->Cell(30,5,utf8_decode('Montant TTC'),0,1,'C');
		
		//Listing
		$pdf->SetFont('Arial','',8);
		
		$options->op = '-e';
		$options->value = $this->Exposition_ID;
		
		$tab = Expense::GetList('', $options);		
		$ttc = 0;
		$ht = 0;
		for($i = 0;$i < $tab['length']; $i++){
			
			switch(@strtoupper(LANG)){
				default:
				case 'FR':
					$DateDep = explode(' ', $tab[$i]['Date']);
					
					list($y, $m, $d) = explode('-', $DateDep[0]);
					
					$tab[$i]['Date'] = "$d/$m/$y";
					break;
			}
			
			$color = ($i % 2 == 0) ? 220 : 255;
			$pdf->SetFillColor($color, $color, $color);
			$pdf->SetDrawColor(255, 255, 255);		
			$pdf->Cell(20,5, $tab[$i]["Frais_ID"] . " ", 'RL', 0,'R', 1);
			$pdf->Cell(100,5, utf8_decode(" " . $tab[$i]["Description"]),'RL',0,'L', 1);
			$pdf->Cell(20,5, utf8_decode(" " . $tab[$i]["Date"]),'RL',0,'C', 1);
			$pdf->Cell(30,5, utf8_decode(" " . number_format($tab[$i]["Montant_HT"], 2) . ' ' . EURO), 'RL', 0, 'R', 1);
			$pdf->Cell(30,5, utf8_decode(" " . number_format($tab[$i]["Montant_TTC"], 2) . ' ' . EURO), 'RL', 1,'R', 1);
			
			$ht += $tab[$i]["Montant_HT"];
			$ttc += $tab[$i]["Montant_TTC"];
		}
		
		$pdf->Ln(1);
		$pdf->Cell(20,5, " ",0,0,'R');
		$pdf->Cell(100,5, " ",0,0,'L');
		$pdf->Cell(20,5, utf8_decode("Total :"),0,0,'R');
		$pdf->Cell(30, 5, number_format($ht, 2). ' ' . EURO, 1, 0, 'R');
		$pdf->Cell(30, 5, number_format($ttc, 2). ' ' . EURO, 1, 0, 'R');
		
		$pdf->Ln(7);
		
		$pdf->SetFont('Arial','B',9);
		$pdf->Cell(0,5,utf8_decode('Description :'), 'B',0,'L');

		$pdf->Ln(7);
		
		$pdf->SetFont('Arial','',8);

		@$pdf->WriteHTML(utf8_decode($this->Description));

		return $pdf;
	}
/**
 * 
 **/	
	public static function printPDFList($clauses = '', $options = ''){
				
		define('EURO',chr(128));
			
		$pdf = new PDFSimpleTable('L','mm','A4');
		$pdf->name = 'Listing des expositions';
		$pdf->AliasNbPages();
		$pdf->AddPage();
		$pdf->SetLeftMargin(5);
		$pdf->SetRightMargin(5);
		$pdf->SetAutoPageBreak(true, 15);
		$pdf->SetDisplayMode('real');
		
		//En-têtes listing
		$pdf->SetFont('Arial','B',8);
		
		$pdf->AddHeader(array(
			'Exposition_ID' => 	array('Title' => 'N°', 'Width' => 15, "BodyAlign" => "R"),
			'Title' => 			array('Title' => 'Titre', 'Width' => 80),
			'DateDep' => 		array('Title' => 'Début le', 'Width' => 30, 'BodyAlign' => 'C'),
			'DateRet' => 		array('Title' => 'Fin le', 'Width' => 30, 'BodyAlign' => 'C'),
			'Adresse' => 		array('Title' => 'Adresse', 'Width' => 60),
			'CP' => 			array('Title' => 'CP', 'Width' => 15, 'BodyAlign' => 'C'),
			'Ville' => 			array('Title' => 'Ville', 'Width' => 50),
		));
		
		$pdf->AddFilters(array('DateDep', 'DateRet'), array('Exposition', 'FilterDate'));
		$pdf->AddFilters('Adresse', array('Exposition', 'FilterAdresse'));
				
		//Listing
		$pdf->SetFont('Arial','',8);
		
		$pdf->AddRows(self::GetList($clauses, $options));
		
		return $pdf;
	}
/**
 * 
 **/	
	public static function FilterDate($e, $short = false){
		
		switch(@strtoupper(LANG)){
			default:
			case 'FR':
				$e = explode(' ', $e);				
				list($y, $m, $d) = explode('-', $e[0]);
				
				$e = "$d/$m/$y" . ($short ? '' : (' à ' . substr($e[1], 0, 5)));
				break;
		}
		
		return $e;
	}
	
	public static function FilterAdresse($e, $data){
		
		return $e;
	}
/**
 * Exposition.GetList() -> Array
 **/		
	public static function GetList($clauses = '', $options = ''){
		$request = 			new Request();
		
		$request->select = 	'*';
		$request->from = 	self::TABLE_NAME;
		
		switch(@$options->op){
			default:break;
			case '-e':
				$request->where = '(DateDep >= NOW() OR (DateRet >= NOW() AND DateDep <= NOW())) ';
				$request->order = 'DateDep';
				break;
				
			case '-f': // 
				$request->where = 'DateRet < NOW()';
				$request->order = 'DateDep DESC';
				break;	
			case '-d':
				$Date_Debut = 	$options->Debut;
				$Date_Fin =		$options->Fin;
				
				$request->where .= "((`DateDep` >= '".$Date_Debut."' AND `DateDep` <= '".$Date_Fin."')
								OR (`DateRet` > '".$Date_Debut."' AND `DateRet` < '".$Date_Fin."')
								OR (`DateDep` <= '".$Date_Debut."' AND `DateRet` >= '".$Date_Fin."'))";	
				break;
		}			

		if(isset($clauses) && $clauses != ''){
			if(@$clauses->where) {
								
				$request->where .= " 	AND (	Title like '%". mysql_real_escape_string($clauses->where) . "%' or 
												Description like '%". mysql_real_escape_string($clauses->where) . "%' or 
												Adresse like '%". mysql_real_escape_string($clauses->where) . "%' or 
												Adresse2 like '%". mysql_real_escape_string($clauses->where) . "%' or 
												Ville like '%". mysql_real_escape_string($clauses->where) . "%' or 
												CP like '%". mysql_real_escape_string($clauses->where) . "%'
											)";
				
			}
			if(@$clauses->order) 	$request->order = $clauses->order;
			if(@$clauses->limits) 	$request->limits = $clauses->limits;
		}	
						
		$result = $request->exec('select');
		//echo $request->query;
		if($result){
			$result['maxLength'] = Sql::count($request->from, $request->where);
		}
		
		return $result;
	}
/**
 * Exposition.onBuildPost() -> void
 **/
 	final public static function onBuildPost(){
		
		preg_match_all('/\[exposition\](.*?)\[\/exposition\]/', Post::Content(), $match);
		
		if(!empty($match)){
			for($i = 0; $i < count($match[0]); $i++){
				$expo = 		new Exposition((int) $match[1][$i]);
				
				$gmap = 		new GoogleMapAPI();
				
				$gmap->setDirectionID('route');
				$gmap->setCenter($expo->CP . ' ' . $expo->Ville);

				$gmap->enableWindowZoom = 			true;
				$gmap->enableAutomaticCenterZoom = 	false;
				$gmap->DisplayDirectionFields =		true;
				$gmap->infoWindowZoom =				10;
				
				// $gmap->setClusterer(true);
				//$gmap->setSize('490px','400px');
				$gmap->setZoom(10);
				$gmap->setLang('fr');
				$gmap->setDefaultHideMarker =		false;
							
				$coordtab = 	array();
				$coordtab[] = 	array(strtolower($expo->CP . ' ' . $expo->Ville), $expo->Ville, '<h2>'. $expo->Title.'</h2><p style=\"margin:0px\">'. $expo->Adresse. '</p><p style=\"margin:0px\">'.$expo->CP . ' ' . $expo->Ville.'</p>');
				
				$gmap->addArrayMarkerByAddress($coordtab, 'cat1');
								
				$string = '
					<div class="exposition">
						<p>L\'exposition "'. $expo->Title .'" aura lieu entre le <b>'.str_replace(':', 'h', self::FilterDate($expo->DateDep)).'</b>
						et le <b>'.str_replace(':', 'h', self::FilterDate($expo->DateRet)).'</b>.</p>
						
						<p>'. $expo->Description .'</p>
						
						<div class="location-expo">
							<h2>Localisation</h2>
							
							<table>
								<th>Adresse</th>
								<td>'. $expo->Adresse . ' ' . $expo->Adresse2.'</td>
								</tr>
								<tr>
								<th>Ville</th>
								<td>'. $expo->CP . ' ' . $expo->Ville .'</td>
								</tr>
							</table>
							
							'.$gmap.'
							
						</div>		
					</div>';
				
				Post::Content(str_replace($match[0][$i], $string, Post::Content()));
			}
		}
	}
}
/**
 * class Expositions
 *
 * Cette classe gère une collection d'Expositions.
 **/
class Expositions extends ObjectTools{
	public $title =			'Expositions à venir';
	public $more =			'plus';
	public $titleClass =	'';
/**
 * Expositions.type -> String
 **/
	public $Type =			'post';
/**
 * Expositions.limits -> Number
 **/
	public $limits = 		5;
/**
 * Expositions.order -> Number
 **/
	public $order = 		'';
/**
 * Expositions.where -> String
 **/
	public $where =			'';
/**
 * Expositions.op -> String
 **/
	protected $op = 		'-e';
/**
 * new Expositions()
 *
 * Cette méthode créée une nouvelle instance `Posts`.
 **/
	function __construct($instance = NULL){
		if(is_object($instance) || is_array($instance)){
			foreach($instance as $key => $value){
				$this->$key = $value;
			}
		}
	}
/**
 * Expositions.Widget() -> String
 **/
	final static function Widget($options = NULL){
		
		$options = 	$posts = new Expositions($options);
		
		$posts = 	$posts->exec();
		
		$string = '<h3 class="'.$options->titleClass.'">' . $options->title;
		
		if($posts['maxLength'] > $posts['length']){
			$string .= '<a class="more" href="'.Blog::GetInfo('uri').'exposition/page/2">'.$options->more.'</a>';	
		}
		
		$string .= '</h3><ul class="list posts-list posts-recently">';
		
		for($i = 0; $i < $posts['length']; $i++){
			
			if($posts[$i]['Post_ID'] == 0){
				$expo = new Exposition((int) $posts[$i]['Exposition_ID']);
				$expo->commit();
			}
			
			$post = new Post((int) $posts[$i]['Post_ID']);
			$string .= '<li class="post-entry post-'.$post->Post_ID.'"><a href="'.Blog::GetInfo('uri').$post->Name.'">'. $post->Title .'</a></li>';
		}
		
		if($i == 0){
			$string .= '<li class="no-entry"><a>Aucune exposition</a></li>';
			$string .= '<li class="last-entry"><a href="'.Blog::GetInfo('uri').'exposition/">Voir les anciennes expositions</a></li>';
		}
		
		$string .= '<div class="clearfloat"></div></ul>';
		
		echo $string;
	}
	
	final public function exec(){
		return Exposition::GetList($this->toObject(), $this->toObject()); 
	}
}
?>