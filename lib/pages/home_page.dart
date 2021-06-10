import 'package:pezsh/config/assets.dart';
import 'package:pezsh/tabs/about_tab.dart';
import 'package:pezsh/tabs/experience_tab.dart';
import 'package:pezsh/tabs/projects_tab.dart';
import 'package:pezsh/widgets/theme_inherited_widget.dart';
import 'package:flutter/material.dart';
class HomePage extends StatefulWidget {
  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedIndex = 0;
  static List<Widget> tabWidgets = <Widget>[
    AboutTab(),
    ExperienceTab(),
    ProjectsTab(),
  ];

  @override
  void initState() {
    super.initState();
  }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
//         appBar: AppBar(
//           actions: <Widget>[
//             IconButton(
//               icon: ThemeSwitcher.of(context).isDarkModeOn?Icon(Icons.wb_sunny):Image.asset(Assets.moon,height: 20,width: 20,),
//               onPressed: ()=> ThemeSwitcher.of(context).switchDarkMode(),
//             )
//           ],
//         ),
        body: Center(
          child: tabWidgets.elementAt(_selectedIndex),
        ),
        bottomNavigationBar: BottomNavigationBar(
          items: const <BottomNavigationBarItem>[
            BottomNavigationBarItem(
              icon: Icon(Icons.account_circle),
              title: Text('About'),
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.chrome_reader_mode),
              title: Text('Experience'),
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.edit),
              title: Text('Projects'),
            )
          ],
          currentIndex: _selectedIndex,
          onTap: (index)=> setState(() => _selectedIndex = index),
          selectedItemColor: Theme.of(context).accentColor,
        ),
    );
  }

}
