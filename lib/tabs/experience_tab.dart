import 'package:flutter/widgets.dart';
import 'package:pezsh/config/assets.dart';
import 'package:pezsh/config/constants.dart';
import 'package:flutter/material.dart';
import 'package:pezsh/config/experience.dart';
import 'package:pezsh/widgets/experience_widget.dart';
import 'package:term_glyph/term_glyph.dart';
import 'dart:html' as html;

import '../widgets/theme_inherited_widget.dart';

class ExperienceTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.only(bottom: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: <Widget>[
              Text(
                'Experience',
                textScaleFactor: 2,
              ),
              SizedBox(
                height: 20,
              ),
              Container(width: MediaQuery. of(context). size.width, height: MediaQuery. of(context). size.height, child: ListView.builder(
                itemCount: experiences.length,
                itemBuilder: (context, index) => ExperienceWidget(experiences[index])
              )),
              
            ],
          ),
        ),
      ),
    );
  }
}
