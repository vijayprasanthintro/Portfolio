import { useEffect, useRef, useState } from 'react';
import { Github, Star, GitFork, ExternalLink, FolderGit2 } from 'lucide-react';
import { socials as defaultSocials } from '../config';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';
import { Magnetic } from './Magnetic';
import { useContent } from '../content/ContentContext';

const CACHE_PREFIX = 'vp-github-repos:';

function readCache(user) {
  try {
    const raw = window.sessionStorage.getItem(CACHE_PREFIX + user);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(user, repos) {
  try {
    window.sessionStorage.setItem(CACHE_PREFIX + user, JSON.stringify(repos));
  } catch {
    /* storage unavailable — just skip caching */
  }
}

export function GithubSection() {
  const [repos, setRepos] = useState([]);
  const [state, setState] = useState('idle'); // 'idle' | 'loading' | 'ready' | 'error'
  const sectionRef = useRef(null);
  const { content } = useContent();
  const socials = content.socials || defaultSocials;
  const user = socials.githubUser;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;

    let controller;
    let timeout;
    let done = false;

    const load = async () => {
      if (done) return;
      done = true;
      const cached = readCache(user);
      if (cached) {
        setRepos(cached);
        setState('ready');
        return;
      }

      setState('loading');
      controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch(
          `https://api.github.com/users/${encodeURIComponent(user)}/repos?sort=updated&per_page=6`,
          {
            headers: { Accept: 'application/vnd.github+json' },
            signal: controller.signal,
          }
        );
        if (!res.ok) throw new Error('GitHub API error');
        const data = await res.json();
        const next = data
          .filter((repo) => !repo.fork)
          .map((repo) => ({
            name: repo.name,
            description: repo.description || 'No description provided.',
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            language: repo.language || 'JavaScript',
            url: repo.html_url,
          }));
        setRepos(next);
        setState('ready');
        writeCache(user, next);
      } catch {
        setState('error');
      } finally {
        clearTimeout(timeout);
      }
    };

    // The section is near the bottom of the page. Don't spend bandwidth on it
    // during initial load — wait until the user actually scrolls close to it.
    if (typeof IntersectionObserver === 'undefined') {
      load();
      return () => controller?.abort();
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          load();
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      controller?.abort();
      clearTimeout(timeout);
    };
  }, [user]);

  return (
    <section id="github" aria-label="GitHub" ref={sectionRef}>
      <div className="container">
        <SectionHeading
          number={9}
          kicker="GitHub"
          title="My open-source work"
          sub="Public repositories I've built while learning and shipping."
        />

        <Reveal>
          <div className="github-card">
            <div className="github-card-head">
              <div className="github-avatar">
                <Github size={34} aria-hidden="true" />
              </div>
              <div className="github-card-meta">
                <h3>{user}</h3>
                <p>Full-stack developer building with the MERN stack.</p>
              </div>
              <Magnetic>
                <a className="btn btn-primary btn-sm" href={socials.github} target="_blank" rel="noreferrer">
                  View GitHub
                  <ExternalLink className="btn-icon" aria-hidden="true" />
                </a>
              </Magnetic>
            </div>

            {(state === 'loading' || state === 'idle') && (
              <p className="muted github-note">Loading repositories…</p>
            )}

            {state === 'ready' && repos.length > 0 && (
              <div className="repo-grid">
                {repos.map((repo) => (
                  <a className="repo-card" href={repo.url} target="_blank" rel="noreferrer" key={repo.name}>
                    <div className="repo-card-top">
                      <FolderGit2 size={18} aria-hidden="true" />
                      <span className="repo-name">{repo.name}</span>
                    </div>
                    <p className="repo-desc">{repo.description}</p>
                    <div className="repo-meta">
                      <span className="repo-lang">
                        <span className="lang-dot" aria-hidden="true" />
                        {repo.language}
                      </span>
                      <span className="repo-stat">
                        <Star size={13} aria-hidden="true" />
                        {repo.stars}
                      </span>
                      <span className="repo-stat">
                        <GitFork size={13} aria-hidden="true" />
                        {repo.forks}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {state === 'error' && (
              <p className="muted github-note">
                Could not load repositories right now — you can still view my profile below.
              </p>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
