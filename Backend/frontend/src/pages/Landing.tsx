import React from 'react'
import { Link } from 'react-router-dom'
import MainLayout from '../layouts/main/MainLayout'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
  { icon: '🎯', title: 'Smart Matching', desc: 'Our algorithm finds students with complementary skills — they teach what you need, you teach what they need.' },
  { icon: '👤', title: 'Rich Profiles', desc: 'Build a detailed skill profile listing everything you can offer and everything you want to learn.' },
  { icon: '🔍', title: 'Easy Discovery', desc: 'Search and filter students by department, year, or specific skill to find the perfect learning partner.' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Create your profile', desc: 'Sign up and list the skills you can teach and the skills you want to learn.' },
  { step: '02', title: 'Discover & match', desc: 'Browse students or check your auto-generated match list to find ideal partners.' },
  { step: '03', title: 'Connect & learn', desc: 'Reach out, agree on a time, and start your peer learning session!' },
]

export default function Landing() {
  const { user } = useAuth()

  return (
    <MainLayout>
      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 mb-4">
              🎓 Built for college students
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Learn from peers,{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                teach your skills
              </span>
            </h1>
            <p className="mt-5 text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
              SkillSwap connects students in your college to teach and learn real skills — for free, from each other.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <>
                  <Link to="/dashboard" className="btn-primary text-base px-6 py-3">Go to Dashboard</Link>
                  <Link to="/discovery" className="btn-secondary text-base px-6 py-3">Discover Students</Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn-primary text-base px-6 py-3">Get Started — Free</Link>
                  <Link to="/discovery" className="btn-secondary text-base px-6 py-3">Browse Students</Link>
                </>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="glass-card p-6 rounded-3xl"
          >
            <h3 className="font-semibold text-slate-600 dark:text-slate-300 mb-4">
              🔥 How matching works
            </h3>
            <div className="space-y-3">
              {[
                { name: 'Asha R.', dept: 'Computer Science • Year 3', offers: ['React', 'TypeScript'], needs: ['UX Design'] },
                { name: 'Vikram P.', dept: 'Electronics • Year 2', offers: ['C', 'Embedded Systems'], needs: ['React'] },
                { name: 'Priya M.', dept: 'Design • Year 4', offers: ['Figma', 'UX Design'], needs: ['TypeScript'] },
              ].map((s, i) => (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + 0.1 * i }}
                  className="p-4 rounded-xl bg-white/50 dark:bg-slate-800/40 border border-white/60 dark:border-slate-700/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{s.name}</div>
                      <div className="text-xs text-slate-400">{s.dept}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {s.offers.map(sk => <span key={sk} className="skill-tag-offered text-xs">{sk}</span>)}
                    {s.needs.map(sk => <span key={sk} className="skill-tag-needed text-xs">{sk}</span>)}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-bold text-center mb-2">Why SkillSwap?</h2>
          <p className="text-center text-slate-500 mb-10">Everything you need to start peer-to-peer learning.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i }}
                className="glass-card p-6 rounded-2xl hover:shadow-xl transition-all"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="py-12">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-bold text-center mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((h, i) => (
              <motion.div
                key={h.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i }}
                className="text-center"
              >
                <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-lg font-bold flex items-center justify-center mb-4 shadow-lg">
                  {h.step}
                </div>
                <h3 className="font-semibold mb-2">{h.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{h.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-10 text-center"
          >
            <h2 className="text-2xl font-bold mb-3">Ready to start skill-swapping?</h2>
            <p className="text-slate-500 mb-6">Join your peers and start learning — totally free.</p>
            <Link to="/register" className="btn-primary text-base px-8 py-3">Create Free Account</Link>
          </motion.div>
        </section>
      )}
    </MainLayout>
  )
}
