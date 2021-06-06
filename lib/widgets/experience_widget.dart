import 'package:pezsh/models/experience_model.dart';
import 'package:flutter/material.dart';
import 'dart:html' as html;

class ExperienceWidget extends StatelessWidget {
  final Experience _experience;
  ExperienceWidget(this._experience);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(left: 20, right: 20), 
      child: InkWell ( 
        onTap: onExperienceClick, 
        child: Card(
          child: Padding(
            padding: EdgeInsets.all(20),
            child: Column(
              children: [
                Row(children: [
                  Column(
                    children: [
                      Text(
                        _experience.company,
                        textScaleFactor: 1.3,
                        textAlign: TextAlign.left,
                      ),
                      Text(
                        _experience.title,
                        textScaleFactor: 1,
                        textAlign: TextAlign.left,
                      )
                    ],
                    crossAxisAlignment: CrossAxisAlignment.start,
                  ),
                Spacer(),
                Column(
                  children: [
                    Text(_experience.start + " - " + _experience.end, textScaleFactor: 0.8),
                    Text(_experience.location, textScaleFactor: 0.8)
                  ],
                )
                ],)
              ],
            )

          )
        )
      )
    );
  }

  void onExperienceClick() {
    if (_experience.link != null) html.window.open(_experience.link, 'pez.sh');
  }
}
