import { Briefcase, Calendar, Building2, CheckCircle2 } from 'lucide-react';
import { profile as defaultProfile } from '../config';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';
import { useContent } from '../content/ContentContext';

const defaultTags = ['MongoDB', 'Express.js', 'REST APIs', 'API Integration'];

function ExperienceCard({ item }) {
  const tags = Array.isArray(item.tags) && item.tags.length ? item.tags : defaultTags;
  const points = Array.isArray(item.points) ? item.points : [];

  return (
    <Reveal>
      <article className="timeline-item">
        <div className="timeline-dot" aria-hidden="true">
          <Briefcase size={18} />
        </div>
        <div className="card timeline-card">
          <div className="timeline-head">
            <div>
              <h3 className="timeline-role">{item.role}</h3>
              <div className="timeline-company">
                <Building2 size={15} aria-hidden="true" />
                {item.company}
              </div>
            </div>
            <span className="chip timeline-chip">
              <Calendar size={13} aria-hidden="true" />
              {item.period || item.duration}
            </span>
          </div>

          {item.description && <p className="timeline-description">{item.description}</p>}

          {points.length > 0 && (
            <div className="timeline-points">
              {points.map((point, index) => (
                <div className="timeline-point" key={`${point}-${index}`}>
                  <CheckCircle2 size={16} aria-hidden="true" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          )}

          <div className="timeline-tags" aria-label="Technologies used">
            {tags.map((tag) => (
              <span className="chip" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </article>
    </Reveal>
  );
}

export function Experience() {
  const { content } = useContent();
  const internship = content.profile?.internship || defaultProfile.internship;
  const saved = Array.isArray(content.experience) ? content.experience : [];
  const records = [...saved].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  const items = records.length ? records : [{ ...internship, id: internship.id || 'internship' }];

  return (
    <section id="experience" aria-label="Experience">
      <div className="container">
        <SectionHeading
          number={5}
          kicker="Experience"
          title="Where I've applied my skills"
          sub="Real-world experience building and testing full-stack applications."
        />

        <div className="timeline">
          {items.map((item, index) => (
            <ExperienceCard item={item} key={item.id || index} />
          ))}
        </div>
      </div>
    </section>
  );
}
