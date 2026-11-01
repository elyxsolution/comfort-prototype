import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { catalogue } from '../lib/data.js';
import { postEnquiry } from '../lib/api.js';
import { Btn, Field } from './Ui.jsx';

const Ctx = createContext({ open: () => {} });
export const useEnquiry = () => useContext(Ctx);

export function EnquiryForm({ project = '', bhk = '', source = 'site', onDone, compact = false }) {
  const [values, setValues] = useState({ name: '', phone: '', email: '', project, bhk: bhk ? String(bhk) : '', message: '', website: '' });
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ status: 'idle', message: '' });

  useEffect(() => {
    setValues((v) => ({ ...v, project, bhk: bhk ? String(bhk) : '' }));
  }, [project, bhk]);

  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  async function submit(e) {
    e.preventDefault();
    const local = {};
    if (values.name.trim().length < 2) local.name = 'Please enter your name';
    if (!/^(\+?91)?[6-9][0-9]{9}$|^\+?[0-9]{8,14}$/.test(values.phone.replace(/[ ()-]/g, ''))) local.phone = 'Enter a valid phone number';
    if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) local.email = 'Enter a valid email';
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }
    setState({ status: 'sending', message: '' });
    const body = { ...values, source };
    if (!body.bhk) delete body.bhk;
    const res = await postEnquiry(body);
    if (res.ok) {
      setState({ status: 'done', message: res.message });
      onDone?.();
    } else {
      setErrors(res.fields || {});
      setState({ status: 'error', message: res.error || 'Something went wrong.' });
    }
  }

  if (state.status === 'done') {
    return (
      <div className="form-done" role="status">
        <p className="form-done__title">Thank you, {values.name.split(' ')[0]}.</p>
        <p>{state.message} For anything urgent, call +91 99000 73744.</p>
      </div>
    );
  }

  return (
    <form className={`form ${compact ? 'form--compact' : ''}`} onSubmit={submit} noValidate>
      <Field label="Your name" name="name" error={errors.name}>
        <input id="name" name="name" autoComplete="name" value={values.name} onChange={set('name')} aria-invalid={!!errors.name} required />
      </Field>
      <Field label="Phone" name="phone" error={errors.phone} hint="We call you, we do not share your number.">
        <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={values.phone} onChange={set('phone')} aria-invalid={!!errors.phone} required />
      </Field>
      <Field label="Email (optional)" name="email" error={errors.email}>
        <input id="email" name="email" type="email" autoComplete="email" value={values.email} onChange={set('email')} aria-invalid={!!errors.email} />
      </Field>
      <div className="form__row">
        <Field label="Project" name="project">
          <select id="project" name="project" value={values.project} onChange={set('project')}>
            <option value="">Not sure yet</option>
            {catalogue.projects.filter((p) => p.status !== 'completed').map((p) => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Home size" name="bhk">
          <select id="bhk" name="bhk" value={values.bhk} onChange={set('bhk')}>
            <option value="">Any</option>
            <option value="2">2 BHK</option>
            <option value="3">3 BHK</option>
            <option value="4">4 BHK</option>
          </select>
        </Field>
      </div>
      {!compact && (
        <Field label="Message (optional)" name="message">
          <textarea id="message" name="message" rows={3} value={values.message} onChange={set('message')} />
        </Field>
      )}
      <div className="hp" aria-hidden="true">
        <label>
          Leave this empty
          <input tabIndex={-1} autoComplete="off" name="website" value={values.website} onChange={set('website')} />
        </label>
      </div>
      {state.status === 'error' && <p className="form__error" role="alert">{state.message}</p>}
      <Btn variant="primary" type="submit" disabled={state.status === 'sending'} onClick={undefined}>
        {state.status === 'sending' ? 'Sending' : 'Request a call back'}
      </Btn>
    </form>
  );
}

export function EnquiryProvider({ children }) {
  const dialog = useRef();
  const [ctx, setCtx] = useState({ project: '', bhk: '' });
  const [key, setKey] = useState(0);

  const open = useCallback((opts = {}) => {
    setCtx({ project: opts.project || '', bhk: opts.bhk || '' });
    setKey((k) => k + 1);
    dialog.current?.showModal();
  }, []);
  const close = () => dialog.current?.close();
  const value = useMemo(() => ({ open }), [open]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <dialog
        ref={dialog}
        className="dialog"
        aria-labelledby="dlg-title"
        onClick={(e) => e.target === dialog.current && close()}
      >
        <div className="dialog__inner">
          <div className="dialog__head">
            <h2 id="dlg-title" className="dialog__title">Book a site visit</h2>
            <button className="dialog__close" onClick={close} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 3l14 14M17 3 3 17" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
            </button>
          </div>
          <p className="dialog__sub">Leave your number. We call you back, usually within the working day.</p>
          <EnquiryForm key={key} project={ctx.project} bhk={ctx.bhk} source="dialog" compact />
        </div>
      </dialog>
    </Ctx.Provider>
  );
}
