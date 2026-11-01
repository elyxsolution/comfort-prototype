import { useRef, useState } from 'react';
import { Btn, Field } from '../components/Ui.jsx';
import { postCareer } from '../lib/api.js';
import { useReveal, useDrift } from '../lib/motion.js';
import PageHero from '../components/PageHero.jsx';
import Archive from '../components/Archive.jsx';

export default function Career() {
  const root = useRef();
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ status: 'idle', message: '' });
  const [file, setFile] = useState('');
  useReveal(root, []);
  useDrift(root, []);

  async function submit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const local = {};
    if (String(fd.get('name')).trim().length < 2) local.name = 'Please enter your name';
    if (!/^\+?[0-9 ()-]{8,16}$/.test(String(fd.get('phone')).trim())) local.phone = 'Enter a valid phone number';
    if (!/^\S+@\S+\.\S+$/.test(String(fd.get('email')).trim())) local.email = 'Enter a valid email';
    const cv = fd.get('cv');
    if (!cv || !cv.size) local.cv = 'Attach your CV (PDF or Word, up to 4 MB)';
    else if (cv.size > 4 * 1024 * 1024) local.cv = 'That file is over 4 MB';
    if (Object.keys(local).length) return setErrors(local);
    setErrors({});
    setState({ status: 'sending', message: '' });
    const res = await postCareer(fd);
    if (res.ok) setState({ status: 'done', message: res.message });
    else {
      setErrors(res.fields || {});
      setState({ status: 'error', message: res.error });
    }
  }

  return (
    <div ref={root} className="page career">
      <PageHero image="comfort-greens" alt="Illustrative 3D render of Comfort Greens">
        <span className="eyebrow" data-r>Careers</span>
        <h1 className="h1" data-r data-r-delay="0.05">Work <em>with us.</em></h1>
        <p className="lead" data-r data-r-delay="0.08">
          Building a home takes many skills, from the drawing board to the housewarming. We are always looking for the right people to join our team.
        </p>
      </PageHero>
      <div className="career__grid">
        <div className="career__text">
          <p data-r>We look for people who are proactive and customer-centric, and who set long-term goals. In return, we offer a good place to work and the chance to learn the latest in construction alongside experienced professionals.</p>
          <p data-r>We believe the growth and success of our people is the same as ours. If you want a challenging, friendly place to build a career, send us your details.</p>
        </div>
        <div className="career__form" data-r>
          {state.status === 'done' ? (
            <div className="form-done" role="status">
              <p className="form-done__title">Thank you.</p>
              <p>{state.message} We will get in touch if there is a fit.</p>
            </div>
          ) : (
            <form className="form" onSubmit={submit} noValidate>
              <div data-r><Field label="Your name" name="name" error={errors.name}>
                <input id="name" name="name" autoComplete="name" aria-invalid={!!errors.name} required />
              </Field></div>
              <div data-r data-r-delay="0.06"><Field label="Phone" name="phone" error={errors.phone}>
                <input id="phone" name="phone" type="tel" autoComplete="tel" aria-invalid={!!errors.phone} required />
              </Field></div>
              <div data-r data-r-delay="0.12"><Field label="Email" name="email" error={errors.email}>
                <input id="email" name="email" type="email" autoComplete="email" aria-invalid={!!errors.email} required />
              </Field></div>
              <div data-r data-r-delay="0.18"><Field label="Your CV" name="cv" error={errors.cv} hint="PDF or Word, up to 4 MB">
                <input id="cv" name="cv" type="file" accept=".pdf,.doc,.docx,application/pdf" onChange={(e) => setFile(e.target.files[0]?.name || '')} aria-invalid={!!errors.cv} />
                {file && <span className="field__hint">Selected: {file}</span>}
              </Field></div>
              <div className="hp" aria-hidden="true">
                <label>Leave this empty<input tabIndex={-1} autoComplete="off" name="website" /></label>
              </div>
              {state.status === 'error' && <p className="form__error" role="alert">{state.message}</p>}
              <Btn type="submit" disabled={state.status === 'sending'}>{state.status === 'sending' ? 'Sending' : 'Send application'}</Btn>
            </form>
          )}
        </div>
      </div>
      <Archive keys={['street', 'vidhana', 'lalbagh', 'siege']} title="A good city to build a career in." />
    </div>
  );
}
