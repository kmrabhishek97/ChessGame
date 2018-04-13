<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
    pageEncoding="ISO-8859-1"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
<title>Chess Game | User</title>
<%
response.setHeader("Cache-Control", "no-cache");
response.setHeader("Cache-Control","no-store");
response.setHeader("Pragma", "no-cache");
response.setDateHeader("Expires", 0);
%>
</head>
<body>
<%
HttpSession hs=request.getSession(false);
String userid=(String)hs.getAttribute("ui");
if(userid==null||hs.isNew())
{
	request.setAttribute("msg", "Invalid userid. Please  do login.");
	RequestDispatcher rd=request.getRequestDispatcher("/jsp/login.jsp");
	rd.forward(request, response);
}
else
{
%>
<h1>Logged in successfully</h1>
<a href="/ChessGame/Logout">Logout</a>
<%} %>
</body>
</html>