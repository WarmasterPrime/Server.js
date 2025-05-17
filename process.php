<?php

if(isset($_POST["message"])) {
	print_r($_POST["message"]);
} else {
	print_r("FAILED");
}

?>