<?php
	session_start();

	$settings = file_get_contents("../settings.json");
	$settings = json_decode($settings);
	//print_r($settings);

	$username=$_POST['username'];
	$password=$_POST['password'];

	echo $password;

	if($username == $settings->LOGIN_USERNAME && $password == $settings->LOGIN_PASSWORD){
		$_SESSION['valid'] = true;
		header('Location: index.php');
	}else{
		header('HTTP/1.0 403 Forbidden');
		echo 'You are forbidden!';
	}

