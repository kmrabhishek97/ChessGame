$(document).ready(function(){
	
	$('.item .delete').click(function(){
		
		var elem = $(this).closest('.item');
		
		$.confirm({
			'title'		: 'Delete Confirmation',
			'message'	: 'You are about to delete this item. <br />It cannot be restored at a later time! Continue?',
			'buttons'	: {
						'Accept': 
						{
							'class'	: 'blue',
							'action': function(){
								alert("You clicked accept")
							}
						},
						'Decline': 
						{
								'class'	: 'gray',
								'action': function(){
									alert("Ypu clicked delete");
								}	// Nothing to do in this case. You can as well omit the action property.
							}
						}
		});
		
	});
	
});