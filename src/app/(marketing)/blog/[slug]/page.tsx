import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Calendar, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BLOG_POSTS, BLOG_CONTENT } from '@/lib/blog-data';

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return { title: 'Post Not Found' };
  return { title: `${post.title} — SmartRetail AI Blog`, description: post.excerpt };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  const content = BLOG_CONTENT[slug] ?? [post.excerpt, 'Full article coming soon.'];
  const related = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <div className="pt-20">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Back */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        {/* Header */}
        <Badge variant="secondary" className="mb-4">{post.category}</Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-5">
          {post.title}
        </h1>
        <p className="text-lg text-muted-foreground mb-6 leading-relaxed">{post.excerpt}</p>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pb-8 border-b border-border mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${post.color}`}>
              {post.author.initials}
            </div>
            <span className="font-medium text-foreground">{post.author.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {post.date}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {post.readTime}
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4">
          {content.map((paragraph, i) => (
            <p key={i} className="text-base text-foreground/90 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 pt-8 border-t border-border bg-muted/30 rounded-xl p-6 text-center">
          <p className="font-semibold mb-2">Ready to try SmartRetail AI?</p>
          <p className="text-sm text-muted-foreground mb-4">
            Start with the free plan — no credit card required.
          </p>
          <Button asChild>
            <Link href="/register">
              Get started free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="border-t border-border bg-muted/20 py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-lg font-semibold mb-6">More from the blog</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <Badge variant="secondary" className="mb-2 text-xs">{p.category}</Badge>
                  <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors">
                    {p.title}
                  </h3>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {p.readTime}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
