import { Toolbar } from './components/Toolbar';
import { Preview } from './components/Preview';
import { PersonalForm } from './components/forms/PersonalForm';
import { ExperienceForm } from './components/forms/ExperienceForm';
import { EducationForm } from './components/forms/EducationForm';
import { ProjectsForm } from './components/forms/ProjectsForm';
import { SkillsForm } from './components/forms/SkillsForm';

export default function App() {
  return (
    <div className="flex h-screen flex-col">
      <Toolbar />
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
        <div className="overflow-y-auto bg-gray-50 p-4">
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            <PersonalForm />
            <ExperienceForm />
            <ProjectsForm />
            <EducationForm />
            <SkillsForm />
            <footer className="pb-10 pt-2 text-center text-xs text-gray-500">
              Your data is stored only in this browser's localStorage. Refresh safe. Close tab and it's still here.
              Clearing browser data will erase it — export JSON if you want a backup.
            </footer>
          </div>
        </div>
        <div className="hidden h-full lg:block">
          <Preview />
        </div>
      </div>
    </div>
  );
}
