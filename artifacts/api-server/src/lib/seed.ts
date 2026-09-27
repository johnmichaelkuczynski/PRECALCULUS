import { db, topicsTable, lecturesTable, assignmentsTable, problemsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

type Lesson = [slug: string, title: string, blurb: string, body: string];

// The short lessons follow the supplied "Precalculus — A Four-Week Course" PDF.
const LESSONS: Lesson[] = [
  ["real-numbers-intervals", "Real numbers, intervals, and absolute value", "The number line that every function lives on.", `# Real numbers, intervals, and absolute value

Real numbers include rational numbers such as $3/4$ and irrational numbers such as $\\sqrt{2}$ and $\\pi$. An interval tells us which values are allowed: $[a,b]$ includes its endpoints, while $(a,b)$ does not.

Absolute value measures distance: $|a-b|$ is the distance between two numbers. The inequality $|x-a|<r$ means $a-r<x<a+r$. In the plane, the distance between $(x_1,y_1)$ and $(x_2,y_2)$ is $d=\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}$.

**In context:** A piston specified as $3.500\\pm0.002$ inches must measure between $3.498$ and $3.502$ inches.`],
  ["functions-notation", "Functions and notation", "One input, exactly one output.", `# Functions and notation

A function assigns exactly one output $f(x)$ to each allowed input $x$. Its **domain** is the set of valid inputs; its **range** is the set of outputs it actually produces. A formula, graph, table, or description can all define a function.

To evaluate $f(a+h)$, substitute $a+h$ wherever $x$ appears. The **difference quotient** $\\frac{f(x+h)-f(x)}{h}$ measures average change per unit of input. Exclude inputs that divide by zero, take an even root of a negative number, or take a logarithm of a non-positive number.

**In context:** Income tax is a piecewise-linear function. Moving into a new bracket changes the rate on the *next* dollar, not on all previous dollars.`],
  ["graphs-functions", "Graphs of functions", "Read domain, range, intercepts, and change from a graph.", `# Graphs of functions

The graph of $f$ contains the points $(x,f(x))$. It passes the **vertical line test** when each input has only one output. The horizontal extent gives the domain; the vertical extent gives the range. Zeros occur where the curve crosses the $x$-axis.

A function increases on an interval if $x_1<x_2$ implies $f(x_1)<f(x_2)$. Even functions satisfy $f(-x)=f(x)$ and reflect across the $y$-axis. Odd functions satisfy $f(-x)=-f(x)$ and rotate symmetrically around the origin.

**In context:** The Keeling curve of atmospheric carbon dioxide shows both a long-run upward trend and a repeating annual cycle. Reading a graph means noticing both.`],
  ["transformations", "Transformations of graphs", "Shift, stretch, and reflect familiar curves.", `# Transformations of graphs

Use $y=a f(b(x-h))+k$ to transform a familiar graph. $h$ shifts it horizontally, $k$ shifts it vertically, $|a|$ stretches it vertically, and $|b|$ compresses it horizontally. Negative $a$ or $b$ reflects it across an axis.

Changes *inside* the function act on inputs and can feel backwards; changes *outside* act on outputs. For example, the vertex of $y=2(x-3)^2+1$ is $(3,1)$.

**In context:** Fahrenheit is a transformed Celsius scale: $F=1.8C+32$. The two scales agree at $-40$.`],
  ["composition", "Combining and composing functions", "Feed one function's output into another.", `# Combining and composing functions

Functions can be added, multiplied, or divided wherever both inputs are defined; division also excludes zeros of the denominator. **Composition** means applying one rule after another: $(f\\circ g)(x)=f(g(x))$.

Order matters: generally $f(g(x))\\ne g(f(x))$. For $f(x)=0.8x$ and $g(x)=x-10$, a $100 purchase costs $72 when the coupon comes first, but $70 when the discount comes first.

The domain of $f\\circ g$ includes only inputs for which $g(x)$ is defined *and* its output is accepted by $f$.`],
  ["inverse-functions", "Inverse functions", "Undo an operation by running it backwards.", `# Inverse functions

A function has an inverse when it is **one-to-one**: different inputs have different outputs. Its graph passes the horizontal line test. The inverse $f^{-1}$ swaps inputs and outputs, so $f(f^{-1}(x))=x$ and $f^{-1}(f(x))=x$.

To find it, write $y=f(x)$, swap $x$ and $y$, then solve for $y$. The inverse graph is the reflection of the original across $y=x$. Restricting $x^2$ to $x\\ge0$ gives the inverse $\\sqrt{x}$.

**In context:** A simple letter-shift cipher encrypts with $E(x)=x+3\\pmod{26}$ and decrypts with $D(x)=x-3\\pmod{26}$.`],
  ["linear-functions", "Linear functions and rates of change", "Constant change produces a straight line.", `# Linear functions and rates of change

The slope between two points is $m=\\frac{y_2-y_1}{x_2-x_1}$. Lines can be written as $y=mx+b$ or $y-y_1=m(x-x_1)$. Horizontal lines have slope zero; vertical lines have undefined slope.

Parallel lines have equal slopes. Perpendicular lines satisfy $m_1m_2=-1$ (when both slopes exist). For a nonlinear function, the slope of a secant line is its average rate of change.

**In context:** A road with a 35% grade rises about 35 feet for every 100 feet of horizontal distance: its slope is $0.35$.`],
  ["quadratic-functions", "Quadratic functions", "The parabola, vertex, and quadratic formula.", `# Quadratic functions

A quadratic $f(x)=ax^2+bx+c$, $a\\ne0$, graphs as a parabola. Vertex form $f(x)=a(x-h)^2+k$ identifies its turning point $(h,k)$; $h=-b/(2a)$. It opens upward when $a>0$ and downward when $a<0$.

Its zeros are $x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}$. The discriminant $D=b^2-4ac$ tells us whether there are two, one, or no real zeros.

**In context:** A ball thrown upward with height $h(t)=-16t^2+64t$ reaches 64 feet after two seconds and lands after four.`],
  ["polynomial-graphs", "Polynomial functions and their graphs", "Degree and zeros determine a smooth curve.", `# Polynomial functions and their graphs

A polynomial $f(x)=a_nx^n+\\cdots+a_0$ is smooth and unbroken. For large $|x|$, its leading term $a_nx^n$ controls the end behavior. Degree $n$ allows at most $n$ real zeros and $n-1$ turning points.

At a zero of odd multiplicity, the graph crosses the axis; at even multiplicity it touches and turns back. For example, $(x+2)(x-1)^2$ crosses at $-2$ and bounces at $1$.

**In context:** The outlines of digital letters use short polynomial curves because they stay smooth at any display size.`],
  ["polynomial-division", "Polynomial division", "Use the remainder to find factors and zeros.", `# Polynomial division

Polynomial long division or synthetic division writes $f(x)=d(x)q(x)+r(x)$, where the remainder has lower degree than the divisor. If the divisor is $x-c$, the remainder is $f(c)$:

$$f(x)=(x-c)q(x)+f(c).$$

Thus $x-c$ is a factor exactly when $f(c)=0$. Once you find one zero of a higher-degree polynomial, divide it out and solve the smaller polynomial.

**In context:** Horner's method uses the same idea to evaluate polynomials efficiently with just $n$ multiplications and additions for degree $n$.`],
  ["polynomial-zeros", "Zeros of polynomials", "Find every solution, including complex ones.", `# Zeros of polynomials

The rational zeros theorem narrows the candidates: for integer coefficients, a rational zero $p/q$ in lowest terms has $p$ dividing the constant term and $q$ dividing the leading coefficient. Test candidates, then divide out successful factors.

The fundamental theorem of algebra says a degree-$n$ polynomial has exactly $n$ complex zeros counting multiplicity. Nonreal zeros of a polynomial with real coefficients come in conjugate pairs.

**In context:** There is no general formula in radicals for a quintic, so numerical methods find its zeros.`],
  ["complex-numbers", "Complex numbers", "Extend the number line to solve every polynomial.", `# Complex numbers

Define $i$ by $i^2=-1$. A complex number is $a+bi$. Add componentwise, multiply using $i^2=-1$, and divide by multiplying numerator and denominator by the conjugate $a-bi$.

Plot $a+bi$ at $(a,b)$ in the complex plane. Its modulus is $|a+bi|=\\sqrt{a^2+b^2}$. Multiplying conjugates gives $(a+bi)(a-bi)=a^2+b^2$.

**In context:** Electrical engineers represent alternating-current impedance as $Z=R+jX$; $j$ is their notation for $i$.`],
  ["rational-functions", "Rational functions and asymptotes", "Understand holes and the lines a curve approaches.", `# Rational functions and asymptotes

A rational function $p(x)/q(x)$ excludes zeros of $q$ from its domain. After canceling common factors, a remaining denominator zero produces a vertical asymptote. A canceled factor produces a **hole**, not a new valid input.

To find horizontal asymptotes, compare degrees: numerator degree smaller gives $y=0$; equal degrees give the ratio of leading coefficients. One higher numerator degree can produce a slant asymptote via division.

**In context:** The thin-lens formula $d_i=fd_o/(d_o-f)$ has an asymptote at $d_o=f$: at the focal point, outgoing rays are parallel.`],
  ["polynomial-inequalities", "Polynomial and rational inequalities", "Use a sign chart instead of guessing.", `# Polynomial and rational inequalities

Move everything to one side and locate numerator zeros and denominator zeros. These critical values divide the number line into intervals where the sign is constant. Test one point in each interval.

For example, $(x-1)(x-3)<0$ is true exactly when $1<x<3$. Exclude denominator zeros even when the inequality includes equality. Never multiply by an expression whose sign is unknown without considering a possible reversal.

**In context:** A projectile at height $h(t)=-16t^2+64t$ is above 48 feet exactly when $1<t<3$.`],
  ["exponentials", "Exponential functions", "Grow by a factor, not a fixed amount.", `# Exponential functions

For $b>0$ and $b\\ne1$, $f(x)=b^x$ grows if $b>1$ and decays if $0<b<1$. Its domain is all real numbers and its range is $(0,\\infty)$.

With $n$ compoundings per year, $A=P(1+r/n)^{nt}$. Continuous compounding gives $A=Pe^{rt}$, where $e\\approx2.71828$.

**In context:** One dollar at 100% annual interest becomes $2 when compounded yearly, but approaches only about $2.718 even with infinitely frequent compounding.`],
  ["logarithms", "Logarithmic functions", "Find the exponent that produces a number.", `# Logarithmic functions

A logarithm undoes exponentiation: $y=\\log_b x$ means $b^y=x$. The domain requires $x>0$. The common log uses base 10; the natural log $\\ln x$ uses base $e$.

Because log and exponential are inverses, their graphs reflect across $y=x$. Logarithmic scales turn multiplication into addition: a change of one unit on a base-10 scale means a tenfold change.

**In context:** Earthquake magnitude uses a logarithmic scale; two whole magnitude units mean roughly 100 times the wave amplitude.`],
  ["log-laws", "Properties of logarithms", "Turn products into sums and solve for exponents.", `# Properties of logarithms

For positive $M,N$, $\\log_b(MN)=\\log_b M+\\log_b N$, $\\log_b(M/N)=\\log_b M-\\log_b N$, and $\\log_b(M^p)=p\\log_b M$.

The change-of-base rule is $\\log_b x=\\frac{\\ln x}{\\ln b}$. To solve $3^x=20$, take logs: $x=\\ln20/\\ln3$. Always check the domain when solving a logarithmic equation.

**In context:** Logarithm tables and slide rules let astronomers replace difficult multiplication with addition long before electronic calculators.`],
  ["growth-decay", "Exponential growth and decay", "Model change proportional to the current amount.", `# Exponential growth and decay

The model $N(t)=N_0e^{kt}$ uses $k>0$ for growth and $k<0$ for decay. Growth has doubling time $\\ln2/k$; decay has half-life $t_{1/2}=\\ln2/|k|$.

To determine $k$ from observations, divide two model equations and take logarithms. The doubling time or half-life stays the same regardless of the initial amount.

**In context:** Carbon-14 has a half-life of about 5,730 years. Measuring how much remains helps date archaeological finds.`],
  ["angles-radians", "Angles and radian measure", "Measure rotation using the arc of a circle.", `# Angles and radian measure

An angle in radians is arc length divided by radius: $\\theta=s/r$. A full turn is $2\\pi$ radians, so $\\pi$ radians equals $180^\\circ$.

When $\\theta$ is in radians, arc length is $s=r\\theta$, sector area is $A=\\frac12r^2\\theta$, and linear speed is $v=r\\omega$. These formulas require radians, not degrees.

**In context:** Eratosthenes estimated Earth's circumference by comparing the Sun's angle at two cities and treating their separation as an arc.`],
  ["unit-circle", "The unit circle and trigonometric functions", "Sine and cosine are coordinates on a circle.", `# The unit circle and trigonometric functions

At angle $\\theta$, the point on the unit circle has coordinates $(\\cos\\theta,\\sin\\theta)$. Thus $\\tan\\theta=\\sin\\theta/\\cos\\theta$ when cosine is not zero. The other trig functions are reciprocals.

The circle equation $x^2+y^2=1$ becomes $\\sin^2\\theta+\\cos^2\\theta=1$. Values repeat every $2\\pi$; signs depend on the quadrant.

**In context:** Surveyors can measure a distant mountain's height using an angle of elevation and the tangent ratio.`],
  ["sine-cosine-graphs", "Graphs of sine and cosine", "Describe amplitude, period, phase, and midline.", `# Graphs of sine and cosine

Both sine and cosine repeat every $2\\pi$ and oscillate between $-1$ and $1$. A sinusoid $y=A\\sin(B(x-C))+D$ has amplitude $|A|$, period $2\\pi/|B|$, horizontal shift $C$, and midline $y=D$.

Tangent repeats every $\\pi$ and has vertical asymptotes where cosine is zero.

**In context:** Alternating-current voltage can be modeled as $V(t)\\approx170\\sin(120\\pi t)$, with 60 cycles per second.`],
  ["trig-identities", "Trigonometric identities", "Rewrite expressions without changing their values.", `# Trigonometric identities

Core identities include $\\sin^2\\theta+\\cos^2\\theta=1$, $1+\\tan^2\\theta=\\sec^2\\theta$, $\\cos(-\\theta)=\\cos\\theta$, and $\\sin(-\\theta)=-\\sin\\theta$.

The sum formulas are $\\sin(\\alpha+\\beta)=\\sin\\alpha\\cos\\beta+\\cos\\alpha\\sin\\beta$ and $\\cos(\\alpha+\\beta)=\\cos\\alpha\\cos\\beta-\\sin\\alpha\\sin\\beta$. Setting $\\alpha=\\beta$ gives $\\sin2\\theta=2\\sin\\theta\\cos\\theta$.

**In context:** Early astronomers built tables of trig values using sum formulas to calculate angles they could not measure directly.`],
  ["inverse-trig", "Inverse trig functions and equations", "Recover an angle and account for periodic solutions.", `# Inverse trig functions and equations

Because sine and cosine repeat, their inverses use restricted ranges: $\\arcsin x\\in[-\\pi/2,\\pi/2]$, $\\arccos x\\in[0,\\pi]$, and $\\arctan x\\in(-\\pi/2,\\pi/2)$.

If $\\sin x=k$, the full solution includes $x=\\arcsin k+2\\pi n$ **or** $x=\\pi-\\arcsin k+2\\pi n$ for integers $n$. A calculator returns only the principal value.

**In context:** Snell's law uses inverse sine to determine when light reflects entirely inside a fiber-optic cable.`],
  ["triangle-laws", "The laws of sines and cosines", "Solve triangles that are not right triangles.", `# The laws of sines and cosines

For sides $a,b,c$ opposite angles $A,B,C$, the law of sines is $a/\\sin A=b/\\sin B=c/\\sin C$. It is useful when two angles and a side are known.

The law of cosines is $c^2=a^2+b^2-2ab\\cos C$. Use it for three sides, or two sides and their included angle. The area is $\\frac12 ab\\sin C$.

**In context:** Surveyors measured a long chain of triangles to estimate the distance from the North Pole to the equator and define the meter.`],
  ["polar-complex", "Polar coordinates and complex numbers", "Locate points by distance and direction.", `# Polar coordinates and complex numbers

Polar coordinates $(r,\\theta)$ convert to $x=r\\cos\\theta$, $y=r\\sin\\theta$, and $r^2=x^2+y^2$. The same point can have angles differing by $2\\pi$.

Write a complex number as $z=r(\\cos\\theta+i\\sin\\theta)$. Multiplication multiplies lengths and adds angles. De Moivre's theorem is $[r(\\cos\\theta+i\\sin\\theta)]^n=r^n(\\cos n\\theta+i\\sin n\\theta)$.

**In context:** Radar plots an echo by its angle and distance, then converts the reading to map coordinates.`],
  ["conic-sections", "Conic sections", "Circles, parabolas, ellipses, and hyperbolas.", `# Conic sections

Second-degree equations describe conics. A circle has $(x-h)^2+(y-k)^2=r^2$; a parabola can have $y^2=4px$; an ellipse has $x^2/a^2+y^2/b^2=1$; a hyperbola can have $x^2/a^2-y^2/b^2=1$.

Eccentricity measures departure from a circle: $e=0$ for a circle, $0<e<1$ for an ellipse, $e=1$ for a parabola, and $e>1$ for a hyperbola.

**In context:** Planetary orbits are ellipses with the Sun at one focus, rather than perfect circles.`],
  ["vectors", "Vectors in the plane", "Combine magnitude and direction.", `# Vectors in the plane

A vector $\\mathbf v=\\langle v_1,v_2\\rangle$ has length $|\\mathbf v|=\\sqrt{v_1^2+v_2^2}$. Add vectors component by component; multiply by a scalar to stretch or reverse them.

The dot product $\\mathbf u\\cdot\\mathbf v=u_1v_1+u_2v_2=|\\mathbf u||\\mathbf v|\\cos\\theta$ measures directional alignment. Perpendicular vectors have dot product zero.

**In context:** A plane flying north at 200 knots in a 30-knot east wind has ground velocity $\\langle30,200\\rangle$.`],
  ["sequences-series", "Sequences and series", "Recognize and add arithmetic and geometric patterns.", `# Sequences and series

Arithmetic sequences add a constant $d$: $a_n=a_1+(n-1)d$. Geometric sequences multiply by a ratio $r$: $a_n=a_1r^{n-1}$.

Finite arithmetic sums satisfy $S_n=n(a_1+a_n)/2$. A geometric series converges when $|r|<1$ and has infinite sum $S=a_1/(1-r)$.

**In context:** Pairing $1+100$, $2+99$, and so on gives fifty pairs of 101, so $1+\\cdots+100=5050$.`],
  ["capstone", "Capstone synthesis", "Functions and change lead directly to calculus.", `# Capstone synthesis

Precalculus studies functions: how to build, read, invert, and measure them. The expression $\\frac{f(x+h)-f(x)}{h}$ is the average rate of change over an interval of width $h$.

Linear functions give a constant slope; polynomials simplify by algebra; exponentials require exponent rules; trig functions use sum identities. Calculus asks what happens as $h\\to0$.

**In context:** For $s(t)=16t^2$, average speed from $t=2$ to $2+h$ is $64+16h$. As $h$ approaches zero, the speed approaches 64 feet per second.`],
];

type Problem = { lesson: number; prompt: string; correctAnswer: string };
const p = (lesson: number, prompt: string, correctAnswer: string): Problem => ({ lesson, prompt, correctAnswer });

const homeworkOne = [
  p(0, "Write the distance formula between $(x_1,y_1)$ and $(x_2,y_2)$.", "d = √((x₂ − x₁)² + (y₂ − y₁)²)"),
  p(6, "Write the slope of the line through $(x_1,y_1)$ and $(x_2,y_2)$.", "m = (y₂ − y₁) / (x₂ − x₁)"),
  p(6, "Write the point-slope form of a line with slope $m$ through $(x_1,y_1)$.", "y − y₁ = m(x − x₁)"),
  p(1, "Write the difference quotient of a function $f$.", "(f(x + h) − f(x)) / h"),
];
const homeworkTwo = [
  p(3, "Write the general transformation of $y=f(x)$ with factors $a,b$ and shifts $h,k$.", "y = a f(b(x − h)) + k"),
  p(4, "Write the composition $(f\\circ g)(x)$.", "(f ∘ g)(x) = f(g(x))"),
  p(5, "Write both conditions that define the inverse function $f^{-1}$.", "f(f⁻¹(x)) = x and f⁻¹(f(x)) = x"),
  p(6, "Write the relationship between the slopes of perpendicular lines.", "m₁ m₂ = −1"),
];
const midterm = [
  homeworkOne[3]!, homeworkOne[1]!,
  p(7, "Write vertex form for a quadratic with vertex $(h,k)$.", "f(x) = a(x − h)² + k"),
  p(7, "Write the quadratic formula for $ax^2+bx+c=0$.", "x = (−b ± √(b² − 4ac)) / (2a)"),
  p(7, "Write the discriminant $D$ of $ax^2+bx+c$.", "D = b² − 4ac"),
  p(9, "Write the remainder theorem for division of $f(x)$ by $x-c$.", "f(x) = (x − c)q(x) + f(c)"),
  p(11, "Write the defining property of the imaginary unit $i$.", "i² = −1"),
  p(11, "Write the modulus of the complex number $a+bi$.", "|a + bi| = √(a² + b²)"),
];
const final = [
  midterm[3]!, homeworkTwo[1]!,
  p(14, "Write the continuous-compounding formula with principal $P$, rate $r$, and time $t$.", "A = Pe^(rt)"),
  p(16, "Write the change-of-base formula for $\\log_b x$ using natural logs.", "log_b x = ln x / ln b"),
  p(17, "Write the half-life formula for continuous decay rate $k$.", "t₁/₂ = ln 2 / |k|"),
  p(18, "Write arc length $s$ in terms of radius $r$ and angle $\\theta$ in radians.", "s = rθ"),
  p(19, "Write the Pythagorean trigonometric identity.", "sin²θ + cos²θ = 1"),
  p(23, "Write the law of cosines for side $c$ opposite angle $C$.", "c² = a² + b² − 2ab cos C"),
  p(24, "Write De Moivre's theorem for $[r(\\cos\\theta+i\\sin\\theta)]^n$.", "[r(cos θ + i sin θ)]^n = r^n(cos nθ + i sin nθ)"),
  p(27, "Write the sum $S$ of an infinite geometric series with first term $a_1$ and $|r|<1$.", "S = a₁ / (1 − r)"),
];
const ASSIGNMENTS = [
  { kind: "homework" as const, title: "Homework 1.1 — Functions and their graphs", weekNumber: 1, isTimed: false, timeLimitMinutes: null, instructions: "Write the key formula in symbols. Use the Algebra and Trigonometry math-keyboard tabs.", problems: homeworkOne },
  { kind: "homework" as const, title: "Homework 1.2 — Transformations, composition, and inverses", weekNumber: 1, isTimed: false, timeLimitMinutes: null, instructions: "Use the on-screen keyboard for exponents, parentheses, and composition.", problems: homeworkTwo },
  { kind: "midterm" as const, title: "Midterm — Weeks 1 & 2", weekNumber: 2, isTimed: true, timeLimitMinutes: 60, instructions: "Cumulative midterm on functions and polynomials. 60 minutes. Math keyboard available; pasting disabled.", problems: midterm },
  { kind: "final" as const, title: "Final Exam — Precalculus", weekNumber: 4, isTimed: true, timeLimitMinutes: 90, instructions: "Cumulative final covering all four weeks. 90 minutes. Math keyboard available; pasting disabled.", problems: final },
];

const weekForIndex = (index: number): number => index < 7 ? 1 : index < 14 ? 2 : index < 21 ? 3 : 4;
const expectedSlugs = LESSONS.map(([slug]) => slug).sort().join(",");

export async function seedIfEmpty(): Promise<void> {
  const result = await db.execute(sql`select count(*)::int as n from topics`);
  const count = Number((result.rows[0] as { n?: number } | undefined)?.n ?? 0);
  if (count > 0) {
    const rows = await db.execute(sql`select slug from topics order by slug`);
    if ((rows.rows as Array<{ slug: string }>).map((row) => row.slug).sort().join(",") !== expectedSlugs) {
      throw new Error("Existing course content differs from Precalculus. Refusing to erase course data or student progress automatically.");
    }
    return;
  }

  await db.transaction(async (tx) => {
    const topicIds: number[] = [];
    for (const [index, [slug, title, blurb, body]] of LESSONS.entries()) {
      const weekNumber = weekForIndex(index);
      const [topic] = await tx.insert(topicsTable).values({ slug, title, blurb, weekNumber, position: index }).returning();
      if (!topic) throw new Error("Unable to create precalculus topic");
      topicIds.push(topic.id);
      await tx.insert(lecturesTable).values({
        topicId: topic.id, weekNumber,
        title: `${weekNumber}.${index - [0, 0, 7, 14, 21][weekNumber]! + 1} ${title}`,
        body,
      });
    }
    for (const [position, assignment] of ASSIGNMENTS.entries()) {
      const { problems, ...details } = assignment;
      const [created] = await tx.insert(assignmentsTable).values({ ...details, position }).returning();
      if (!created) throw new Error("Unable to create precalculus assignment");
      for (const [index, problem] of problems.entries()) {
        await tx.insert(problemsTable).values({
          assignmentId: created.id, topicId: topicIds[problem.lesson]!, position: index,
          prompt: problem.prompt, correctAnswer: problem.correctAnswer,
          explanation: problem.correctAnswer, hint: null,
        });
      }
    }
  });
  logger.info({ topics: LESSONS.length, assignments: ASSIGNMENTS.length }, "Precalculus course seeded");
}