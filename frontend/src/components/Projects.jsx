import { lazy, memo, Suspense, useCallback, useMemo, useState } from 'react';
import { Github, Rocket, ExternalLink, Star, Info, Image as ImageIcon } from 'lucide-react';
import { projects as defaultProjects } from '../data/projects';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';
import { SpotlightCard } from './SpotlightCard';
import { Magnetic } from './Magnetic';
import { useContent } from '../content/ContentContext';

// Dialogs are only needed after a user action, so keep them out of the initial bundle.
const ProjectModal = lazy(() =>
  import('./ProjectModal').then((module) => ({ default: module.ProjectModal }))
);
const ProjectLightbox = lazy(() =>
  import('./ProjectLightbox').then((module) => ({ default: module.ProjectLightbox }))
);

const CardButtons = memo(function CardButtons({ project, onDetails, onImage }) {
  return (
    <div className="project-actions">
      {project.demo ? (
        <Magnetic>
          <a className="btn btn-primary btn-sm" href={project.demo} target="_blank" rel="noreferrer">
            <Rocket className="btn-icon" aria-hidden="true" />
            Live Demo
            <ExternalLink className="btn-icon" aria-hidden="true" />
          </a>
        </Magnetic>
      ) : (
        <span
          className="btn btn-primary btn-sm btn-disabled"
          role="note"
          title="No live URL available for this project"
        >
          <Rocket className="btn-icon" aria-hidden="true" />
          Live Demo
          <span className="sr-only">(not available)</span>
        </span>
      )}
      <Magnetic>
        <a className="btn btn-ghost btn-sm" href={project.github} target="_blank" rel="noreferrer">
          <Github className="btn-icon" aria-hidden="true" />
          GitHub
        </a>
      </Magnetic>
      <Magnetic>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onDetails(project)}>
          <Info className="btn-icon" aria-hidden="true" />
          View Details
        </button>
      </Magnetic>
      <Magnetic>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onImage(project)}>
          <ImageIcon className="btn-icon" aria-hidden="true" />
          Show Image
        </button>
      </Magnetic>
    </div>
  );
});

const ProjectHead = memo(function ProjectHead({ project }) {
  return (
    <div className="project-head">
      {project.featured && (
        <span className="featured-badge">
          <Star size={13} aria-hidden="true" />
          Featured
        </span>
      )}
      <span className="project-role">{project.role}</span>
    </div>
  );
});

export function Projects() {
  const [selected, setSelected] = useState(null);
  const [imageFor, setImageFor] = useState(null);
  const { content } = useContent();
  const saved = Array.isArray(content.projects) && content.projects.length ? content.projects : defaultProjects;
  const projects = [...saved].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

  const { featured, rest } = useMemo(
    () => ({
      featured: projects.filter((p) => p.featured),
      rest: projects.filter((p) => !p.featured),
    }),
    [projects]
  );

  const closeDetails = useCallback(() => setSelected(null), []);
  const closeImage = useCallback(() => setImageFor(null), []);

  return (
    <section id="projects" aria-label="Projects">
      <div className="container">
        <SectionHeading
          number={4}
          kicker="Featured Projects"
          title="Some of the applications I've built using modern web technologies."
          sub="Real projects built while learning full-stack development — from idea to working application."
        />

        {featured.map((project) => (
          <Reveal key={project.id}>
            <SpotlightCard className="project-card project-featured">
              <article className="project-featured-inner">
                <div className="project-body">
                  <ProjectHead project={project} />
                  <h3 className="project-title">{project.name}</h3>
                  <p className="project-desc">{project.short}</p>

                  <div className="project-stack" aria-label="Technologies used">
                    {project.stack.map((tech) => (
                      <span className="chip" key={tech}>
                        <span className="chip-dot" aria-hidden="true" />
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="project-features" aria-label="Key features">
                    {project.features.slice(0, 6).map((feature) => (
                      <span key={feature} className="feature-tick">
                        ✓ {feature}
                      </span>
                    ))}
                  </div>

                  <CardButtons project={project} onDetails={setSelected} onImage={setImageFor} />
                </div>
              </article>
            </SpotlightCard>
          </Reveal>
        ))}

        <div className="projects-grid">
          {rest.map((project, i) => (
            <Reveal key={project.id} delay={(i % 2) + 1}>
              <SpotlightCard className="project-card">
                <article>
                  <div className="project-body">
                    <ProjectHead project={project} />
                    <h3 className="project-title">{project.name}</h3>
                    <p className="project-desc">{project.short}</p>

                    <div className="project-stack" aria-label="Technologies used">
                      {project.stack.map((tech) => (
                        <span className="chip" key={tech}>
                          <span className="chip-dot" aria-hidden="true" />
                          {tech}
                        </span>
                      ))}
                    </div>

                    <CardButtons project={project} onDetails={setSelected} onImage={setImageFor} />
                  </div>
                </article>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>

      {selected && (
        <Suspense fallback={null}>
          <ProjectModal project={selected} onClose={closeDetails} />
        </Suspense>
      )}
      {imageFor && (
        <Suspense fallback={null}>
          <ProjectLightbox project={imageFor} onClose={closeImage} />
        </Suspense>
      )}
    </section>
  );
}
