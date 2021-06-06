import 'package:pezsh/models/project_model.dart';
import 'assets.dart';

final List<Project> projects = [
  Project(
      name: 'pez-k8s',
      image: Assets.github,
      description:
      'This is a project to migrate all my smaller projects into kubernetes. I\'m using terraform to control all the infrastructure in GCP',
      link:
      'https://github.com/rwejlgaard/pez-k8s'),
  Project(
      name: 'Phoenix',
      image: Assets.phoenix,
      description:
      "Phoenix is a personal project I've started to automate my life. It's a collection of Cloud Functions with a companion iOS application. Functions are timed or can be activated ad-hoc.",
      link: 'https://github.com/rwejlgaard/phoenix'),
];