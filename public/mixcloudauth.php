<?php
	if(!isset($_SESSION['valid'])||!$_SESSION['valid']){
		exit();
	}
	error_reporting(0);
	function saveSettings($key,$value){
		$settings=getSettings();
		$settings->$key=$value;
		print_r($settings);
		$fp = fopen('../settings.json', 'w');
		fwrite($fp, json_encode($settings));
		fclose($fp);
	}
	function getSettings(){
		$settings = file_get_contents("../settings.json");
		$settings = json_decode($settings);
		return $settings;
	}
	$settings=getSettings();


	$OAUTH_CODE=$_GET['code'];

	$url = "https://www.mixcloud.com/oauth/access_token?client_id=".$settings->MIXCLOUD_API_CLIENT_ID."&redirect_uri=http://mixcloud.electricradio.co.uk/mixcloudauth&client_secret=".$settings->MIXCLOUD_API_CLIENT_SECRET."&code=".$OAUTH_CODE;


	$json = file_get_contents($url);
	$obj = json_decode($json);
	print_r($obj);
	if(isset($obj->access_token)){
		echo $obj->access_token;
		saveSettings('MIXCLOUD_API_ACCESS_TOKEN',$obj->access_token);
		header('Location: index.php');
	}else{
		header('HTTP/1.0 403 Forbidden');
		echo 'You are forbidden!';
	}


	exit();
?>



