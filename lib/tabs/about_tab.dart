import 'package:auto_size_text/auto_size_text.dart';
import 'package:pezsh/config/assets.dart';
import 'package:pezsh/config/constants.dart';
import 'package:flutter/material.dart';

import 'dart:html' as html;

import '../widgets/theme_inherited_widget.dart';

class AboutTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.only(bottom: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: <Widget>[
              CircleAvatar(
                radius: 100,
                backgroundImage: Image.asset(Assets.profile).image,
              ),
              SizedBox(
                height: 20,
              ),
              Text(
                'Rasmus "Pez" Wejlgaard',
                textScaleFactor: 4,
                textAlign: TextAlign.center,
              ),
              SizedBox(
                height: 20,
              ),
              Text(
                'Senior GCP Platform Engineer',
                style: Theme.of(context).textTheme.caption,
                textScaleFactor: 2,
                textAlign: TextAlign.center,
              ),
              SizedBox(
                height: 40,
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: <Widget>[
                  FlatButton.icon(
                    icon: SizedBox(
                        width: 20,
                        height: 20,
                        child: Image.asset(Assets.github)),
                    label: Text('Github'),
                    onPressed: () => html.window
                        .open(Constants.PROFILE_GITHUB, 'rwejlgaard'),
                  ),
                  FlatButton.icon(
                    icon: SizedBox(
                        width: 20,
                        height: 20,
                        child: Image.asset(Assets.whatsapp)),
                    label: Text('WhatsApp'),
                    onPressed: () => showDialog(context: context, builder: (context) => AlertDialog(
                      title: const Text('WhatsApp Phone Number'),
                      content: new Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text("Add the following number on your phone:"),
                          Text("+45 91 35 57 42", textScaleFactor: 1.5)
                        ],
                      ),
                      actions: <Widget>[
                        new FlatButton(
                          onPressed: () {
                            Navigator.of(context).pop();
                          },
                          textColor: Theme.of(context).primaryTextTheme.bodyText1.color,
                          child: const Text('Close'),
                        ),
                      ],
                    ),)
                  ),
                  FlatButton.icon(
                    icon: SizedBox(
                        width: 20,
                        height: 20,
                        child: Image.asset(Assets.linkedin)),
                    label: Text('LinkedIn'),
                    onPressed: () => html.window
                        .open(Constants.PROFILE_LINKEDIN, 'rwejlgaard'),
                  ),
                ],
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: <Widget>[
                  FlatButton.icon(
                    icon: SizedBox(
                        width: 20,
                        height: 20,
                        child: Image.asset(Assets.signal)),
                    label: Text('Signal'),
                    onPressed: () => showDialog(context: context, builder: (context) => AlertDialog(
                      title: const Text('Signal Phone Number'),
                      content: new Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text("Add the following number on your phone:"),
                          Text("+44 7570 186 729", textScaleFactor: 1.5)
                        ],
                      ),
                      actions: <Widget>[
                        new FlatButton(
                          onPressed: () {
                            Navigator.of(context).pop();
                          },
                          textColor: Theme.of(context).primaryTextTheme.bodyText1.color,
                          child: const Text('Close'),
                        ),
                      ],
                    ),)
                        
                  ),
                  FlatButton.icon(
                    icon: SizedBox(
                        width: 20,
                        height: 20,
                        child: Image.asset(Assets.keybase)),
                    label: Text('KeyBase'),
                    onPressed: () => html.window
                        .open(Constants.PROFILE_KEYBASE, 'keybase'),
                  ),
                  FlatButton.icon(
                    icon: Icon(Icons.mail_outline, size: 20),
                    label: Text('E-Mail'),
                    onPressed: () => html.window
                        .open(Constants.PROFILE_EMAIL, 'pez@pez.sh'),
                  ),
                ],
              ),
              SizedBox(
                height: 40,
              ),
              Text(
                'Hosted with ❤️ on Google Cloud',
                style: Theme.of(context).textTheme.caption,
                textScaleFactor: 1,
                textAlign: TextAlign.center,
              ),
              SizedBox(
                height: 40,
              ),
              TextButton(
                onPressed: () => html.window.open("/cv.pdf", 'cv'), 
                child: Text("Download CV")
              ),
              
            ],
          ),
        ),
      ),
    );
  }
}
