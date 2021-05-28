<?php
if(!isset($_SESSION['valid'])||!$_SESSION['valid']){
	exit();
}

$lines=array();
$logfile="../output.log";
if(!file_exists($logfile)){
	exit();
}
$fp = fopen($logfile, "r");
while(!feof($fp))
{
	$line = fgets($fp, 4096);
	array_push($lines, $line);
	if (count($lines)>1000)
		array_shift($lines);
}
fclose($fp);

echo'<ul class="logs">';
foreach ($lines as $line) {
	echo '<li>'.$line.'</li>';
}

echo'</ul>';
