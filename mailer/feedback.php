<?php 
//require 'PHPMailerAutoload.php';
require 'form_setting.php';

if(isset($_POST)){
	require_once('class.phpmailer.php');
	require_once('class.smtp.php');
	
	//$name = 'name';
	//$email = 'email';
	//$message = 'message';


	$name = $_POST['name'];
	$email = $_POST['email'];
	$message = $_POST['message'];

	$messages  = "<h3>New message from the site " .$fromName. "</h3> \r\n";
	$messages .= "<ul>";
	$messages .= "<li><strong>Name: </strong>" .$name."</li>";
	$messages .= "<li><strong>Email: </strong>" .$email."</li>";
	$messages .= "<li><strong>Message: </strong>" .$message."</li>";
	$messages .= "</ul> \r\n";

	$mail = new PHPMailer(true);

	
	//server settings
	//$mail->SMTPDebug = 2;
	$mail->isSMTP();
	$mail->Host = 'smtp-mail.outlook.com';
	//$mail->SMTPAuth = true;
	$mail->Username = 'wejlgaard@live.dk';
	$mail->Password = 'W!jlgaard123';
	//$mail->SMTPSecure = 'tls';
	$mail->Port = 25;

	$mail->From = $from;
	$mail->FromName = $fromName;
	$mail->addAddress($to, 'Admin');

	$mail->isHTML(true); 
	$mail->CharSet = $charset;

	$mail->Subject = $subj;
	$mail->Body    = $messages;

	if(!$mail->send()) {
		print json_encode(array('status'=>0));
	} else {
	    print json_encode(array('status'=>1));
	}
}
	
?>
