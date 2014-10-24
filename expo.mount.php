<?php
/*
Plugin Name: Exposition Manager
Plugin URI:	http://www.javalyss.fr/marketplace/exposition/
Description: Cette extension ajoute la gestion des expositions et notes de frais pour les artisants.
Author: Lenzotti Romain
Version: 1.1
Author URI: http://rom-makita.fr

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA

*/

System::addScript(Plugin::Uri().'js/class_expense.js');
System::addScript(Plugin::Uri().'js/class_exposition.js');

include_once('inc/class_exposition.php');
include_once('inc/class_expense.php');

System::observe('gateway.exec', array('Exposition', 'exec'));
System::observe('gateway.exec', array('Expense', 'exec'));
System::observe('plugin.active', array('Exposition','Active')); 
System::observe('plugin.active', array('Expense','Active')); 
System::observe('plugin.configure', array('Exposition','Configure')); 
System::observe('plugin.deactive', array('Exposition','Deactive'));
System::Observe('blog:post.build', array('Exposition', 'onBuildPost'));
System::observe('blog:startinterface', array('Exposition','onStartInterface'));
?>