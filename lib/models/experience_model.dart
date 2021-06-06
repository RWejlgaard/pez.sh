import 'package:flutter/material.dart';

class Experience{
  bool active;
  String image;
  String company;
  String title;
  String location;
  String start;
  String end;
  String link;
  Experience({this.active, this.image, @required this.company ,@required this.title, @required this.location, @required this.start, @required this.end, this.link});
}